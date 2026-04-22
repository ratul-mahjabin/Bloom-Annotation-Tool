#!/usr/bin/env node
/**
 * Migration script to update existing annotation files to ML-ready format
 * Run with: node migrate-annotations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function migrateAnnotations() {
  const annotationsDir = path.join(__dirname, 'annotations');
  
  if (!fs.existsSync(annotationsDir)) {
    console.log('No annotations directory found. Skipping migration.');
    return;
  }

  const annotators = fs.readdirSync(annotationsDir);
  let migratedCount = 0;
  let skippedCount = 0;

  annotators.forEach(annotatorName => {
    const annotatorPath = path.join(annotationsDir, annotatorName);
    
    if (!fs.statSync(annotatorPath).isDirectory()) {
      return;
    }

    const files = fs.readdirSync(annotatorPath).filter(f => f.endsWith('.json'));

    files.forEach(filename => {
      const filepath = path.join(annotatorPath, filename);
      let data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

      // Check if already migrated (has fullText)
      if (data.fullText) {
        console.log(`✓ Already migrated: ${annotatorName}/${filename}`);
        skippedCount++;
        return;
      }

      console.log(`Migrating: ${annotatorName}/${filename}`);

      // Generate fullText by concatenating all turns with newlines
      const conversation = data.conversation;
      let fullText = '';
      let turnOffsets = [];

      conversation.turns.forEach((turn, index) => {
        turnOffsets.push({
          turn_index: turn.turn_index,
          role: turn.role,
          stage: turn.stage,
          startOffsetInFull: fullText.length,
          textLength: turn.text.length,
          endOffsetInFull: fullText.length + turn.text.length
        });
        fullText += turn.text;
        if (index < conversation.turns.length - 1) {
          fullText += '\n';
        }
      });

      // Enhance annotations with ML-ready fields
      const enhancedAnnotations = data.spanAnnotations.map(ann => {
        // Extract text from fullText to validate
        const extractedText = fullText.substring(ann.start_offset, ann.end_offset);

        // Find context windows (surrounding turns)
        const turnWithAnnotation = conversation.turns.find(
          t => t.turn_index === ann.turnIndex
        );
        const turnIndex = conversation.turns.findIndex(
          t => t.turn_index === ann.turnIndex
        );

        let contextBefore = '';
        let contextAfter = '';

        if (turnIndex > 0) {
          contextBefore = conversation.turns[turnIndex - 1].text;
        }
        if (turnIndex < conversation.turns.length - 1) {
          contextAfter = conversation.turns[turnIndex + 1].text;
        }

        return {
          ...ann,
          // Validation fields
          extractedTextFromFullText: extractedText,
          textMatchesAnnotation: extractedText.trim() === ann.text.trim(),
          // ML context
          contextBefore,
          contextAfter,
          roleInTurn: turnWithAnnotation?.role,
          stageInTurn: turnWithAnnotation?.stage
        };
      });

      // Create migrated data structure
      const migratedData = {
        annotatorName: data.annotatorName,
        prolificId: data.prolificId,
        metadata: {
          totalTurns: conversation.turns.length,
          totalAnnotations: data.spanAnnotations.length,
          fullTextLength: fullText.length,
          bloomLevelsUsed: [
            ...new Set(data.spanAnnotations.flatMap(a => a.labels))
          ],
          annotationDate: data.timestamp
        },
        fullText,
        fullTextReconstruction: {
          method: 'concatenate_turns_with_newlines',
          turnDelimiter: '\n',
          description: 'Full text reconstructed by joining all turns with newline separators'
        },
        conversation: {
          prolificId: conversation.prolificId,
          username: conversation.username,
          turns: conversation.turns.map((turn, index) => ({
            ...turn,
            startOffsetInFull: turnOffsets[index].startOffsetInFull,
            endOffsetInFull: turnOffsets[index].endOffsetInFull,
            textLength: turn.text.length
          }))
        },
        spanAnnotations: enhancedAnnotations,
        bloomScores: data.bloomScores,
        overallComment: data.overallComment,
        timestamp: data.timestamp
      };

      // Write migrated data
      fs.writeFileSync(filepath, JSON.stringify(migratedData, null, 2));
      console.log(`  ✓ Enhanced with fullText (${fullText.length} chars)`);
      console.log(`  ✓ Added metadata and turn offsets`);
      console.log(`  ✓ Added context windows and validation fields`);
      migratedCount++;
    });
  });

  console.log(`\n╔════════════════════════════════════════╗`);
  console.log(`║   Migration Complete                   ║`);
  console.log(`║   Migrated: ${String(migratedCount).padEnd(27, ' ')} ║`);
  console.log(`║   Skipped:  ${String(skippedCount).padEnd(27, ' ')} ║`);
  console.log(`╚════════════════════════════════════════╝`);
}

migrateAnnotations();
