import { diagnose as __doeFn_diagnose } from '../diagnose/index.js';
import { generateCandidates as __doeFn_generateCandidates } from '../generate-candidates/index.js';
import { locationAt as __doeFn_locationAt } from '../location-at/index.js';
import { repairDescription as __doeFn_repairDescription } from '../repair-description/index.js';
// Origin: public/yrkie-doe/core/schema-json-recovery.js:936


export function parse(textInput) {
    const text = String(textInput ?? "");
    try {
      return {
        ok: true,
        value: JSON.parse(text),
        text,
        repaired: false,
        repairs: [],
        diagnostics: [],
      };
    } catch (error) {
      const diagnostic = (0, __doeFn_diagnose)(text, error);
      const maxRepairs = 8;
      const maxStates = 160;
      const queue = [{ text, repairs: [], score: 0 }];
      const visited = new Set([text]);
      const accepted = [];
      let acceptedDepth = Infinity;

      while (queue.length && visited.size <= maxStates) {
        const state = queue.shift();
        if (state.repairs.length >= acceptedDepth) continue;

        try {
          const value = JSON.parse(state.text);
          acceptedDepth = state.repairs.length;
          accepted.push({
            ...state,
            value,
            semanticKey: JSON.stringify(value),
          });
          continue;
        } catch (stateError) {
          if (state.repairs.length >= maxRepairs) continue;
          const nextCandidates = (0, __doeFn_generateCandidates)(state.text, stateError).sort(
            (left, right) => left.priority - right.priority,
          );
          nextCandidates.forEach((repair) => {
            if (visited.size >= maxStates || visited.has(repair.text)) return;
            visited.add(repair.text);
            queue.push({
              text: repair.text,
              score: state.score + repair.priority,
              repairs: [
                ...state.repairs,
                {
                  ...repair,
                  ...(0, __doeFn_locationAt)(state.text, repair.index),
                  description: (0, __doeFn_repairDescription)(repair),
                },
              ],
            });
          });
          queue.sort(
            (left, right) =>
              left.score - right.score || left.repairs.length - right.repairs.length,
          );
        }
      }

      const semanticResults = new Map();
      accepted.forEach((entry) => {
        const current = semanticResults.get(entry.semanticKey);
        if (
          !current ||
          entry.repairs.length < current.repairs.length ||
          (entry.repairs.length === current.repairs.length && entry.score < current.score)
        ) {
          semanticResults.set(entry.semanticKey, entry);
        }
      });

      if (semanticResults.size === 1) {
        const [{ repairs, value, text: repairedText }] = [...semanticResults.values()];
        return {
          ok: true,
          value,
          text: repairedText,
          repaired: true,
          repairs,
          diagnostics: [diagnostic],
          originalError: error,
        };
      }

      return {
        ok: false,
        text,
        repaired: false,
        repairs: [],
        diagnostics: [
          {
            ...diagnostic,
            ambiguous: semanticResults.size > 1,
          },
        ],
        error,
      };
    }
  }
