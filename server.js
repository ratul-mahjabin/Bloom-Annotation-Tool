import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Serve built React app from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Store conversations in memory
let conversations = {};

// Load CSV on startup
function loadConversations() {
  const csvPath = path.join(__dirname, 'treatment_transcripts_with_stage.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    return;
  }

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      const prolificId = row.prolificId.trim();
      
      if (!conversations[prolificId]) {
        conversations[prolificId] = {
          prolificId,
          username: row.username.trim(),
          turns: []
        };
      }
      
      conversations[prolificId].turns.push({
        turn_index: parseInt(row.turn_index),
        role: row.role.trim(),
        text: row.text.trim(),
        stage: parseInt(row.stage)
      });
    })
    .on('end', () => {
      // Sort turns by index for each conversation
      Object.keys(conversations).forEach(prolificId => {
        conversations[prolificId].turns.sort((a, b) => a.turn_index - b.turn_index);
      });
      console.log(`✓ Loaded ${Object.keys(conversations).length} conversations from CSV`);
    })
    .on('error', (err) => {
      console.error('Error loading CSV:', err);
    });
}

// API Routes
app.get('/api/conversations', (req, res) => {
  try {
    const prolificIds = Object.keys(conversations).sort();
    res.json({ prolificIds, total: prolificIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/conversation/:prolificId', (req, res) => {
  try {
    const { prolificId } = req.params;
    const conversation = conversations[prolificId];
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/save-annotation', (req, res) => {
  try {
    const { annotatorName, prolificId, cidNumber, annotations, bloomScores, comment } = req.body;
    
    if (!annotatorName || !prolificId) {
      return res.status(400).json({ error: 'Missing annotatorName or prolificId' });
    }
    
    const conversation = conversations[prolificId];

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (!Array.isArray(annotations)) {
      return res.status(400).json({ error: 'Annotations must be an array' });
    }

    for (let index = 0; index < annotations.length; index++) {
      const annotation = annotations[index];
      const annotationText = annotation?.text ?? annotation?.extracted_text;
      const turnIndex = annotation?.turnIndex ?? annotation?.turn_index;
      const offsetInTurn = annotation?.offsetInTurn ?? annotation?.start_char_in_turn;
      const turn = conversation.turns.find(t => t.turn_index === turnIndex);

      if (!turn) {
        return res.status(400).json({
          error: `Annotation ${index + 1} references a turn that is not in this conversation`
        });
      }

      if (
        typeof annotationText !== 'string' ||
        !Number.isInteger(offsetInTurn) ||
        !Array.isArray(annotation?.labels)
      ) {
        return res.status(400).json({
          error: `Annotation ${index + 1} has invalid text, labels, or offset data`
        });
      }

      if (offsetInTurn < 0 || offsetInTurn + annotationText.length > turn.text.length) {
        return res.status(400).json({
          error: `Annotation ${index + 1} falls outside its referenced turn`
        });
      }

      if (turn.text.substring(offsetInTurn, offsetInTurn + annotationText.length) !== annotationText) {
        return res.status(400).json({
          error: `Annotation ${index + 1} text does not match its referenced turn`
        });
      }
    }

    // Create annotator directory after the request has passed validation.
    const annotatorDir = path.join(__dirname, 'annotations', annotatorName);
    if (!fs.existsSync(annotatorDir)) {
      fs.mkdirSync(annotatorDir, { recursive: true });
    }
    
    // Enhance annotations with turn-based structure (simpler and more robust)
    const enhancedAnnotations = annotations.map(ann => {
      const annotationText = ann.text ?? ann.extracted_text;
      const turnIndex = ann.turnIndex ?? ann.turn_index;
      const offsetInTurn = ann.offsetInTurn ?? ann.start_char_in_turn;

      // Find the turn with this annotation
      const turnWithAnnotation = conversation.turns.find(t => t.turn_index === turnIndex);
      const turnIdx = conversation.turns.findIndex(t => t.turn_index === turnIndex);
      
      // Get context turns
      const beforeTurn = turnIdx > 0 ? conversation.turns[turnIdx - 1] : null;
      const afterTurn = turnIdx < conversation.turns.length - 1 ? conversation.turns[turnIdx + 1] : null;
      
      // Extract exact text from turn to validate
      const extractedText = turnWithAnnotation.text.substring(
        offsetInTurn,
        offsetInTurn + annotationText.length
      );
      
      return {
        id: ann.id,
        extracted_text: extractedText,
        labels: ann.labels,
        
        // Turn-based location (PRIMARY - most important)
        turn_index: turnIndex,
        start_char_in_turn: offsetInTurn,
        end_char_in_turn: offsetInTurn + annotationText.length,
        
        // Validation
        text_matches: extractedText === annotationText,
        
        // Context for ML
        context: {
          before_turn_index: beforeTurn?.turn_index ?? null,
          before_text: beforeTurn?.text ?? null,
          after_turn_index: afterTurn?.turn_index ?? null,
          after_text: afterTurn?.text ?? null
        },
        
        // Turn metadata
        turn_role: turnWithAnnotation.role,
        turn_stage: turnWithAnnotation.stage,
        
        timestamp: ann.timestamp
      };
    });
    
    // Prepare save data with turn-based structure
    const saveData = {
      annotatorName,
      prolificId,
      metadata: {
        totalTurns: conversation.turns.length,
        totalAnnotations: annotations.length,
        bloomLevelsUsed: [...new Set(annotations.flatMap(a => a.labels))],
        annotationDate: new Date().toISOString()
      },
      conversation: {
        prolificId: conversation.prolificId,
        username: conversation.username,
        turns: conversation.turns
      },
      spanAnnotations: enhancedAnnotations,
      bloomScores,
      overallComment: comment,
      timestamp: new Date().toISOString()
    };
    
    // Save to JSON file with CID format
    const filename = `CID${cidNumber}_${annotatorName}.json`;
    const filepath = path.join(annotatorDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(saveData, null, 2));
    
    res.json({ 
      success: true, 
      message: `Annotation saved to ${filename}`,
      filepath 
    });
  } catch (err) {
    console.error('Error saving annotation:', err);
    res.status(500).json({ error: err.message });
  }
});

// Load annotations for editing
app.get('/api/load-annotation/:annotatorName/:prolificId/:cidNumber', (req, res) => {
  try {
    const { annotatorName, prolificId, cidNumber } = req.params;
    const filename = `CID${cidNumber}_${annotatorName}.json`;
    const filepath = path.join(__dirname, 'annotations', annotatorName, filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Annotation file not found' });
    }
    
    const data = fs.readFileSync(filepath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if annotation exists
app.get('/api/annotation-exists/:annotatorName/:prolificId/:cidNumber', (req, res) => {
  try {
    const { annotatorName, prolificId, cidNumber } = req.params;
    const filename = `CID${cidNumber}_${annotatorName}.json`;
    const filepath = path.join(__dirname, 'annotations', annotatorName, filename);
    
    res.json({ exists: fs.existsSync(filepath) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get annotation status: exists, complete (all bloomScores filled), and confused span count
app.get('/api/annotation-status/:annotatorName/:prolificId/:cidNumber', (req, res) => {
  try {
    const { annotatorName, prolificId, cidNumber } = req.params;
    const filename = `CID${cidNumber}_${annotatorName}.json`;
    const filepath = path.join(__dirname, 'annotations', annotatorName, filename);

    if (!fs.existsSync(filepath)) {
      return res.json({ exists: false, complete: false, confusedCount: 0 });
    }

    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    const scores = data.bloomScores || {};
    const bloomKeys = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
    const complete = bloomKeys.every(k => scores[k] !== null && scores[k] !== undefined);
    const confusedCount = (data.spanAnnotations || []).filter(a =>
      Array.isArray(a.labels) && a.labels.includes('confused')
    ).length;

    res.json({ exists: true, complete, confusedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all confused span cases for an annotator (across all CIDs)
app.get('/api/confused-cases/:annotatorName', (req, res) => {
  try {
    const { annotatorName } = req.params;
    const annotatorDir = path.join(__dirname, 'annotations', annotatorName);

    if (!fs.existsSync(annotatorDir)) {
      return res.json({ cases: [] });
    }

    const files = fs.readdirSync(annotatorDir).filter(f => f.endsWith('.json'));
    const cases = [];

    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(annotatorDir, file), 'utf-8'));
        // Extract CID number from filename (e.g. CID3_annotatorName.json -> 3)
        const cidMatch = file.match(/^CID(\d+)_/);
        const cidNumber = cidMatch ? parseInt(cidMatch[1]) : null;

        const confusedSpans = (data.spanAnnotations || []).filter(a =>
          Array.isArray(a.labels) && a.labels.includes('confused')
        );

        if (confusedSpans.length > 0) {
          cases.push({
            cidNumber,
            prolificId: data.prolificId,
            confusedSpans: confusedSpans.map(s => ({
              text: s.extracted_text || s.text,
              turnIndex: s.turn_index,
              role: s.turn_role,
              allLabels: s.labels
            }))
          });
        }
      } catch (e) {
        // skip malformed files
      }
    }

    cases.sort((a, b) => a.cidNumber - b.cidNumber);
    res.json({ cases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all annotator names
app.get('/api/annotators', (req, res) => {
  try {
    const annotationsDir = path.join(__dirname, 'annotations');
    let annotators = [];
    
    if (fs.existsSync(annotationsDir)) {
      annotators = fs.readdirSync(annotationsDir).filter(name => {
        return fs.statSync(path.join(annotationsDir, name)).isDirectory();
      });
    }
    
    res.json({ annotators });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Catch-all route for React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  loadConversations();
  console.log(`
╔════════════════════════════════════════╗
║   Bloom Annotation Tool                ║
║   Server running on port ${PORT}           ║
║   http://localhost:${PORT}            ║
╚════════════════════════════════════════╝
  `);
});
