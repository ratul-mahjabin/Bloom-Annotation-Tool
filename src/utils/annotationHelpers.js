/**
 * Utility functions for working with turn-based span annotations
 * Used by both server and client for consistent annotation extraction
 */

/**
 * Extract annotated text from a conversation using turn-based offsets
 * @param {Object} annotation - Annotation object with turn_index, start_char_in_turn, end_char_in_turn
 * @param {Object} conversation - Conversation object with turns array
 * @returns {string} The extracted text
 */
export function extractSpanText(annotation, conversation) {
  const turn = conversation.turns.find(t => t.turn_index === annotation.turn_index);
  if (!turn) {
    throw new Error(`Turn ${annotation.turn_index} not found`);
  }
  
  return turn.text.substring(
    annotation.start_char_in_turn,
    annotation.end_char_in_turn
  );
}

/**
 * Validate that annotation offsets correctly point to the stored text
 * @param {Object} annotation - Annotation to validate
 * @param {Object} conversation - Conversation object
 * @returns {Object} Validation result { valid: bool, extractedText: string, message: string }
 */
export function validateAnnotation(annotation, conversation) {
  try {
    const extractedText = extractSpanText(annotation, conversation);
    const matches = extractedText === annotation.text;
    
    return {
      valid: matches,
      extractedText,
      message: matches
        ? 'Annotation offsets are correct'
        : `Text mismatch: stored="${annotation.text}" vs extracted="${extractedText}"`
    };
  } catch (error) {
    return {
      valid: false,
      extractedText: null,
      message: error.message
    };
  }
}

/**
 * Find character offsets within a turn for a given text
 * Returns all possible matches
 * @param {string} text - Text to find
 * @param {string} turnText - The turn text to search in
 * @returns {Array} Array of {start, end} positions
 */
export function findOffsetsInTurn(text, turnText) {
  const matches = [];
  let index = 0;
  
  while ((index = turnText.indexOf(text, index)) !== -1) {
    matches.push({
      start_char_in_turn: index,
      end_char_in_turn: index + text.length
    });
    index += 1;
  }
  
  return matches;
}

/**
 * Create full annotation object with all metadata
 * @param {Object} params - Parameters
 * @returns {Object} Complete annotation object
 */
export function createAnnotation(params) {
  const {
    turn_index,
    start_char_in_turn,
    end_char_in_turn,
    text,
    labels,
    conversation,
    annotator,
    timestamp
  } = params;

  const turn = conversation.turns.find(t => t.turn_index === turn_index);
  if (!turn) {
    throw new Error(`Turn ${turn_index} not found`);
  }

  // Get context turns
  const turnIdx = conversation.turns.findIndex(t => t.turn_index === turn_index);
  const beforeTurn = turnIdx > 0 ? conversation.turns[turnIdx - 1] : null;
  const afterTurn = turnIdx < conversation.turns.length - 1 ? conversation.turns[turnIdx + 1] : null;

  return {
    id: Date.now(),
    text,
    labels,
    turn_index,
    start_char_in_turn,
    end_char_in_turn,
    extracted_text: turn.text.substring(start_char_in_turn, end_char_in_turn),
    context: {
      before_turn_index: beforeTurn?.turn_index ?? null,
      before_text: beforeTurn?.text ?? null,
      after_turn_index: afterTurn?.turn_index ?? null,
      after_text: afterTurn?.text ?? null
    },
    turn_role: turn.role,
    turn_stage: turn.stage,
    annotator,
    timestamp
  };
}
