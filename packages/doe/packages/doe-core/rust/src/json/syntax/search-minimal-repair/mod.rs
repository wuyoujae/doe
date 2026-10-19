// Origin: app/backend/core/src/json_syntax_repair.rs::search_minimal_repair
use super::*;


pub(super) fn search_minimal_repair(raw: &str, rank: impl Fn(&Value) -> Option<usize>) -> Option<RepairState> {
    let max_states = (MAX_SEARCH_CANDIDATE_BYTES / raw.len().max(1)).clamp(16, MAX_SEARCH_STATES);
    let mut frontier = vec![RepairState {
        text: raw.to_string(),
        edits: Vec::new(),
    }];
    let mut visited = HashMap::<u64, usize>::new();
    visited.insert(text_hash(raw), 0);
    let mut successes = BTreeMap::<String, RepairState>::new();
    let mut best_total_cost = None;
    let mut explored = 0usize;

    while !frontier.is_empty() && explored < max_states {
        frontier.sort_by(|left, right| {
            right
                .cost()
                .cmp(&left.cost())
                .then_with(|| right.text.len().cmp(&left.text.len()))
                .then_with(|| right.text.cmp(&left.text))
        });
        let state = frontier.pop().expect("frontier is not empty");
        if best_total_cost.is_some_and(|cost| state.cost() > cost) {
            break;
        }
        explored += 1;

        match serde_json::from_str::<Value>(&state.text) {
            Ok(value) => {
                let canonical = serde_json::to_string(&value).ok()?;
                if let Some(rank_cost) = rank(&value) {
                    let total_cost = state.cost().checked_add(rank_cost)?;
                    match best_total_cost {
                        Some(best) if total_cost < best => {
                            best_total_cost = Some(total_cost);
                            successes.clear();
                            successes.insert(canonical, state);
                        }
                        Some(best) if total_cost == best => {
                            successes.entry(canonical).or_insert(state);
                        }
                        None => {
                            best_total_cost = Some(total_cost);
                            successes.insert(canonical, state);
                        }
                        _ => {}
                    }
                }
            }
            Err(error)
                if state.cost() < MAX_REPAIRS_PER_VALUE
                    && best_total_cost.is_none_or(|cost| state.cost() < cost) =>
            {
                for neighbor in generate_neighbors(&state, &error) {
                    if neighbor.cost() > MAX_REPAIRS_PER_VALUE {
                        continue;
                    }
                    let hash = text_hash(&neighbor.text);
                    if visited
                        .get(&hash)
                        .is_some_and(|known_cost| *known_cost <= neighbor.cost())
                    {
                        continue;
                    }
                    visited.insert(hash, neighbor.cost());
                    if frontier.len() < max_states {
                        frontier.push(neighbor);
                    }
                }
            }
            Err(_) => {}
        }
    }

    (successes.len() == 1)
        .then(|| successes.into_values().next())
        .flatten()
}
