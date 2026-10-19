use std::collections::{HashMap, HashSet};

use serde::{Deserialize, Serialize};

use crate::error::MemoryError;
use crate::types::{MemoryPoint, MemoryPointKind, HEADLESS_POINT_ID};

#[derive(Debug, Clone, PartialEq, Eq)]
struct ChildPosition {
    parent_id: String,
    index: usize,
}

#[derive(Debug, Clone)]
pub struct MemoryTree {
    nodes: HashMap<String, MemoryPoint>,
    children: HashMap<String, Vec<String>>,
    child_positions: HashMap<String, ChildPosition>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MemoryTypeSearchOptions {
    pub relation_depth: usize,
    pub max_parent_types: usize,
    pub max_matches_per_type: usize,
    pub max_neighborhood_nodes: usize,
}

impl Default for MemoryTypeSearchOptions {
    fn default() -> Self {
        Self {
            relation_depth: 1,
            max_parent_types: 5,
            max_matches_per_type: 5,
            max_neighborhood_nodes: 64,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MemoryRecallOptions {
    pub max_types: usize,
    pub max_matches_per_type: usize,
    pub max_returned_memories: usize,
}

impl Default for MemoryRecallOptions {
    fn default() -> Self {
        Self {
            max_types: 5,
            max_matches_per_type: 3,
            max_returned_memories: 64,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MemoryTypeNeighborhood {
    pub query_type: String,
    pub matched_point_id: String,
    pub points: Vec<MemoryNeighborhoodPoint>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MemoryRecallBranch {
    pub query_type: String,
    pub matched_point_id: String,
    pub memories: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MemoryNeighborhoodPoint {
    pub point_id: String,
    pub parent_id: Option<String>,
    pub kind: MemoryPointKind,
    pub relation_depth: i32,
    pub storage: Option<String>,
    pub types: Option<String>,
}

impl MemoryTree {
    pub fn new() -> Self {
        let headless = MemoryPoint::headless();
        let mut nodes = HashMap::new();
        nodes.insert(headless.point_id.clone(), headless);

        Self {
            nodes,
            children: HashMap::new(),
            child_positions: HashMap::new(),
        }
    }

    pub fn from_points(points: Vec<MemoryPoint>) -> Result<Self, MemoryError> {
        let mut tree = Self::new();

        for point in points {
            if point.is_headless() {
                point.validate()?;
                tree.nodes.insert(HEADLESS_POINT_ID.to_string(), point);
                continue;
            }

            if tree.nodes.contains_key(&point.point_id) {
                return Err(MemoryError::DuplicatePoint {
                    point_id: point.point_id,
                });
            }

            point.validate()?;
            tree.nodes.insert(point.point_id.clone(), point);
        }

        tree.rebuild_indexes()?;
        tree.validate()?;
        Ok(tree)
    }

    pub fn insert_root(
        &mut self,
        storage: impl Into<String>,
        types: impl Into<String>,
    ) -> Result<String, MemoryError> {
        let point = MemoryPoint::new_root(storage, types)?;
        self.insert_point(point)
    }

    pub fn insert_child(
        &mut self,
        parent_id: &str,
        storage: impl Into<String>,
        types: impl Into<String>,
    ) -> Result<String, MemoryError> {
        self.ensure_parent_exists(parent_id)?;
        let point = if parent_id == HEADLESS_POINT_ID {
            MemoryPoint::new_root(storage, types)?
        } else {
            MemoryPoint::new_child(parent_id, storage, types)?
        };
        self.insert_point(point)
    }

    pub fn insert_point(&mut self, mut point: MemoryPoint) -> Result<String, MemoryError> {
        if point.is_headless() {
            return Err(MemoryError::CannotInsertHeadless);
        }

        point.validate()?;

        if self.nodes.contains_key(&point.point_id) {
            return Err(MemoryError::DuplicatePoint {
                point_id: point.point_id,
            });
        }

        let parent_id = point.parent_id.clone().ok_or(MemoryError::MissingParent)?;
        self.ensure_parent_exists(&parent_id)?;

        point.kind = if parent_id == HEADLESS_POINT_ID {
            MemoryPointKind::Root
        } else {
            MemoryPointKind::Point
        };

        let point_id = point.point_id.clone();
        self.nodes.insert(point_id.clone(), point);
        self.attach_child(&parent_id, &point_id);
        Ok(point_id)
    }

    pub fn contains(&self, point_id: &str) -> bool {
        self.nodes.contains_key(point_id)
    }

    pub fn len(&self) -> usize {
        self.nodes.len()
    }

    pub fn memory_len(&self) -> usize {
        self.nodes.len().saturating_sub(1)
    }

    pub fn is_empty(&self) -> bool {
        self.memory_len() == 0
    }

    pub fn get(&self, point_id: &str) -> Option<&MemoryPoint> {
        self.nodes.get(point_id)
    }

    pub fn iter_points(&self) -> impl Iterator<Item = &MemoryPoint> {
        self.nodes.values()
    }

    pub fn to_points(&self) -> Vec<MemoryPoint> {
        self.nodes.values().cloned().collect()
    }

    pub fn root_ids(&self) -> Vec<String> {
        self.children
            .get(HEADLESS_POINT_ID)
            .cloned()
            .unwrap_or_default()
    }

    pub fn child_ids(&self, parent_id: &str) -> Result<Vec<String>, MemoryError> {
        self.ensure_point_exists(parent_id)?;
        Ok(self.children.get(parent_id).cloned().unwrap_or_default())
    }

    pub fn children(&self, parent_id: &str) -> Result<Vec<&MemoryPoint>, MemoryError> {
        self.ensure_point_exists(parent_id)?;
        self.children
            .get(parent_id)
            .into_iter()
            .flatten()
            .map(|child_id| self.require_point(child_id))
            .collect()
    }

    pub fn subtree_ids(&self, start_id: &str) -> Result<Vec<String>, MemoryError> {
        self.ensure_point_exists(start_id)?;

        let mut result = Vec::new();
        let mut stack = vec![start_id.to_string()];

        while let Some(point_id) = stack.pop() {
            result.push(point_id.clone());
            if let Some(child_ids) = self.children.get(&point_id) {
                for child_id in child_ids.iter().rev() {
                    stack.push(child_id.clone());
                }
            }
        }

        Ok(result)
    }

    pub fn subtree(&self, start_id: &str) -> Result<Vec<&MemoryPoint>, MemoryError> {
        self.subtree_ids(start_id)?
            .iter()
            .map(|point_id| self.require_point(point_id))
            .collect()
    }

    pub fn path_ids(&self, point_id: &str) -> Result<Vec<String>, MemoryError> {
        self.ensure_point_exists(point_id)?;

        let mut path = Vec::new();
        let mut current_id = Some(point_id.to_string());
        let mut visited = HashSet::new();

        while let Some(id) = current_id {
            if !visited.insert(id.clone()) {
                return Err(MemoryError::CycleDetected {
                    point_id: point_id.to_string(),
                    parent_id: id,
                });
            }

            let point = self.require_point(&id)?;
            path.push(id);
            current_id = point.parent_id.clone();
        }

        path.reverse();
        Ok(path)
    }

    pub fn find_type_neighborhoods(
        &self,
        possible_parent_types: &[String],
        options: &MemoryTypeSearchOptions,
    ) -> Result<Vec<MemoryTypeNeighborhood>, MemoryError> {
        let query_types = normalize_query_types(possible_parent_types, options.max_parent_types);
        let mut neighborhoods = Vec::new();

        for query_type in query_types {
            let mut matches = self.matching_points_by_type(&query_type);
            matches.sort_by(|left, right| {
                right
                    .0
                    .cmp(&left.0)
                    .then_with(|| left.1.point_id.cmp(&right.1.point_id))
            });

            for (_, point) in matches.into_iter().take(options.max_matches_per_type) {
                let points = self.collect_neighborhood_points(
                    &point.point_id,
                    options.relation_depth,
                    options.max_neighborhood_nodes,
                )?;

                neighborhoods.push(MemoryTypeNeighborhood {
                    query_type: query_type.clone(),
                    matched_point_id: point.point_id.clone(),
                    points,
                });
            }
        }

        if neighborhoods.is_empty() && !self.is_empty() {
            let fallback_query_type = possible_parent_types
                .iter()
                .find_map(|query_type| {
                    let query_type = query_type.trim();
                    (!query_type.is_empty()).then(|| query_type.to_string())
                })
                .unwrap_or_else(|| "root fallback".to_string());

            for root_id in self
                .root_ids()
                .into_iter()
                .take(options.max_matches_per_type)
            {
                let points = self.collect_neighborhood_points(
                    &root_id,
                    options.relation_depth,
                    options.max_neighborhood_nodes,
                )?;

                neighborhoods.push(MemoryTypeNeighborhood {
                    query_type: fallback_query_type.clone(),
                    matched_point_id: root_id,
                    points,
                });
            }
        }

        Ok(neighborhoods)
    }

    pub fn recall_subtree_memories(
        &self,
        memory_types: &[String],
        options: &MemoryRecallOptions,
    ) -> Result<Vec<MemoryRecallBranch>, MemoryError> {
        let query_types = normalize_query_types(memory_types, options.max_types);
        let mut branches = Vec::new();
        let mut seen_branch_ids = HashSet::new();
        let mut seen_memory_point_ids = HashSet::new();
        let mut returned_memories = 0usize;

        for query_type in query_types {
            if returned_memories >= options.max_returned_memories {
                break;
            }

            let mut matches = self.matching_points_by_type(&query_type);
            matches.sort_by(|left, right| {
                right
                    .0
                    .cmp(&left.0)
                    .then_with(|| left.1.point_id.cmp(&right.1.point_id))
            });

            for (_, point) in matches.into_iter().take(options.max_matches_per_type) {
                if returned_memories >= options.max_returned_memories {
                    break;
                }
                if !seen_branch_ids.insert(point.point_id.clone()) {
                    continue;
                }

                let mut memories = Vec::new();
                for point_id in self.subtree_ids(&point.point_id)? {
                    if returned_memories >= options.max_returned_memories {
                        break;
                    }
                    if !seen_memory_point_ids.insert(point_id.clone()) {
                        continue;
                    }

                    let subtree_point = self.require_point(&point_id)?;
                    if !subtree_point.is_active() {
                        continue;
                    }
                    if let Some(storage) = subtree_point
                        .storage
                        .as_deref()
                        .map(str::trim)
                        .filter(|storage| !storage.is_empty())
                    {
                        memories.push(storage.to_string());
                        returned_memories += 1;
                    }
                }

                if !memories.is_empty() {
                    branches.push(MemoryRecallBranch {
                        query_type: query_type.clone(),
                        matched_point_id: point.point_id.clone(),
                        memories,
                    });
                }
            }
        }

        Ok(branches)
    }

    pub fn format_type_neighborhoods_for_model(neighborhoods: &[MemoryTypeNeighborhood]) -> String {
        if neighborhoods.is_empty() {
            return "<existing-memory-candidates>\n</existing-memory-candidates>".to_string();
        }

        let mut lines = vec!["<existing-memory-candidates>".to_string()];

        for neighborhood in neighborhoods {
            lines.push(format!(
                "  <candidate query_type=\"{}\" matched_point_id=\"{}\">",
                escape_model_text(&neighborhood.query_type),
                escape_model_text(&neighborhood.matched_point_id)
            ));

            for point in &neighborhood.points {
                lines.push(format!(
                    "    - relation_depth={} kind={:?} point_id={} parent_id={} types={} storage={}",
                    point.relation_depth,
                    point.kind,
                    escape_model_text(&point.point_id),
                    point
                        .parent_id
                        .as_deref()
                        .map(escape_model_text)
                        .unwrap_or_else(|| "none".to_string()),
                    point
                        .types
                        .as_deref()
                        .map(escape_model_text)
                        .unwrap_or_else(|| "none".to_string()),
                    point
                        .storage
                        .as_deref()
                        .map(escape_model_text)
                        .unwrap_or_else(|| "none".to_string())
                ));
            }

            lines.push("  </candidate>".to_string());
        }

        lines.push("</existing-memory-candidates>".to_string());
        lines.join("\n")
    }

    pub fn update_types(
        &mut self,
        point_id: &str,
        new_types: impl Into<String>,
    ) -> Result<(), MemoryError> {
        self.require_point_mut(point_id)?.update_types(new_types)
    }

    pub fn update_storage(
        &mut self,
        point_id: &str,
        new_storage: impl Into<String>,
    ) -> Result<(), MemoryError> {
        self.require_point_mut(point_id)?
            .update_storage(new_storage)
    }

    pub fn deactivate(&mut self, point_id: &str) -> Result<(), MemoryError> {
        self.require_point_mut(point_id)?.deactivate()
    }

    pub fn reactivate(&mut self, point_id: &str) -> Result<(), MemoryError> {
        self.require_point_mut(point_id)?.reactivate()
    }

    pub fn reparent(&mut self, point_id: &str, new_parent_id: &str) -> Result<(), MemoryError> {
        if point_id == HEADLESS_POINT_ID {
            return Err(MemoryError::HeadlessModification {
                operation: "reparent",
            });
        }

        self.ensure_point_exists(point_id)?;
        self.ensure_parent_exists(new_parent_id)?;

        if point_id == new_parent_id || self.is_ancestor(point_id, new_parent_id)? {
            return Err(MemoryError::CycleDetected {
                point_id: point_id.to_string(),
                parent_id: new_parent_id.to_string(),
            });
        }

        let old_parent_id = self
            .require_point(point_id)?
            .parent_id
            .clone()
            .ok_or(MemoryError::MissingParent)?;

        if old_parent_id == new_parent_id {
            return Ok(());
        }

        self.detach_child(point_id)?;
        self.require_point_mut(point_id)?
            .set_parent(new_parent_id.to_string())?;
        self.attach_child(new_parent_id, point_id);
        Ok(())
    }

    pub fn validate(&self) -> Result<(), MemoryError> {
        let headless = self.require_point(HEADLESS_POINT_ID)?;
        headless.validate()?;

        for point in self.nodes.values() {
            point.validate()?;

            if point.is_headless() {
                continue;
            }

            let parent_id = point
                .parent_id
                .as_deref()
                .ok_or(MemoryError::MissingParent)?;
            self.ensure_parent_exists(parent_id)?;

            if parent_id == HEADLESS_POINT_ID && point.kind != MemoryPointKind::Root {
                return Err(MemoryError::InvalidPointKind {
                    point_id: point.point_id.clone(),
                    expected: "root",
                });
            }
            if parent_id != HEADLESS_POINT_ID && point.kind != MemoryPointKind::Point {
                return Err(MemoryError::InvalidPointKind {
                    point_id: point.point_id.clone(),
                    expected: "point",
                });
            }

            self.assert_reaches_headless(&point.point_id)?;
        }

        for (parent_id, child_ids) in &self.children {
            self.ensure_point_exists(parent_id)?;
            for (index, child_id) in child_ids.iter().enumerate() {
                let child = self.require_point(child_id)?;
                if child.parent_id.as_deref() != Some(parent_id.as_str()) {
                    return Err(MemoryError::TreeInvariant {
                        message: format!("child '{}' has mismatched parent", child_id),
                    });
                }

                let position = self.child_positions.get(child_id).ok_or_else(|| {
                    MemoryError::TreeInvariant {
                        message: format!("child '{}' is missing position index", child_id),
                    }
                })?;

                if position.parent_id != *parent_id || position.index != index {
                    return Err(MemoryError::TreeInvariant {
                        message: format!("child '{}' has stale position index", child_id),
                    });
                }
            }
        }

        for point in self.nodes.values() {
            if point.is_headless() {
                continue;
            }
            if !self.child_positions.contains_key(&point.point_id) {
                return Err(MemoryError::TreeInvariant {
                    message: format!("point '{}' is missing from child index", point.point_id),
                });
            }
        }

        Ok(())
    }

    fn require_point(&self, point_id: &str) -> Result<&MemoryPoint, MemoryError> {
        self.nodes
            .get(point_id)
            .ok_or_else(|| MemoryError::PointNotFound {
                point_id: point_id.to_string(),
            })
    }

    fn require_point_mut(&mut self, point_id: &str) -> Result<&mut MemoryPoint, MemoryError> {
        self.nodes
            .get_mut(point_id)
            .ok_or_else(|| MemoryError::PointNotFound {
                point_id: point_id.to_string(),
            })
    }

    fn ensure_point_exists(&self, point_id: &str) -> Result<(), MemoryError> {
        if self.nodes.contains_key(point_id) {
            Ok(())
        } else {
            Err(MemoryError::PointNotFound {
                point_id: point_id.to_string(),
            })
        }
    }

    fn ensure_parent_exists(&self, parent_id: &str) -> Result<(), MemoryError> {
        if self.nodes.contains_key(parent_id) {
            Ok(())
        } else {
            Err(MemoryError::ParentNotFound {
                parent_id: parent_id.to_string(),
            })
        }
    }

    fn attach_child(&mut self, parent_id: &str, child_id: &str) {
        let child_ids = self.children.entry(parent_id.to_string()).or_default();
        let index = child_ids.len();
        child_ids.push(child_id.to_string());
        self.child_positions.insert(
            child_id.to_string(),
            ChildPosition {
                parent_id: parent_id.to_string(),
                index,
            },
        );
    }

    fn detach_child(&mut self, child_id: &str) -> Result<(), MemoryError> {
        let position =
            self.child_positions
                .remove(child_id)
                .ok_or_else(|| MemoryError::TreeInvariant {
                    message: format!("child '{}' is missing from position index", child_id),
                })?;

        let remove_parent_entry;

        {
            let child_ids = self.children.get_mut(&position.parent_id).ok_or_else(|| {
                MemoryError::TreeInvariant {
                    message: format!(
                        "parent '{}' is missing from children index",
                        position.parent_id
                    ),
                }
            })?;

            if child_ids.get(position.index).map(String::as_str) != Some(child_id) {
                return Err(MemoryError::TreeInvariant {
                    message: format!("child '{}' has inconsistent position index", child_id),
                });
            }

            child_ids.swap_remove(position.index);

            if position.index < child_ids.len() {
                let moved_child_id = child_ids[position.index].clone();
                if let Some(moved_position) = self.child_positions.get_mut(&moved_child_id) {
                    moved_position.index = position.index;
                }
            }

            remove_parent_entry = child_ids.is_empty();
        }

        if remove_parent_entry {
            self.children.remove(&position.parent_id);
        }

        Ok(())
    }

    fn is_ancestor(&self, ancestor_id: &str, point_id: &str) -> Result<bool, MemoryError> {
        let mut current_id = Some(point_id.to_string());

        while let Some(id) = current_id {
            if id == ancestor_id {
                return Ok(true);
            }
            current_id = self.require_point(&id)?.parent_id.clone();
        }

        Ok(false)
    }

    fn assert_reaches_headless(&self, point_id: &str) -> Result<(), MemoryError> {
        let mut current_id = Some(point_id.to_string());
        let mut steps = 0usize;
        let max_steps = self.nodes.len();

        while let Some(id) = current_id {
            if steps > max_steps {
                let parent_id = self
                    .nodes
                    .get(&id)
                    .and_then(|point| point.parent_id.clone())
                    .unwrap_or_default();
                return Err(MemoryError::CycleDetected {
                    point_id: point_id.to_string(),
                    parent_id,
                });
            }

            if id == HEADLESS_POINT_ID {
                return Ok(());
            }

            current_id = self.require_point(&id)?.parent_id.clone();
            steps += 1;
        }

        Err(MemoryError::TreeInvariant {
            message: format!("point '{}' does not reach headless", point_id),
        })
    }

    fn rebuild_indexes(&mut self) -> Result<(), MemoryError> {
        self.children.clear();
        self.child_positions.clear();

        let links: Vec<(String, String)> = self
            .nodes
            .values()
            .filter(|point| !point.is_headless())
            .map(|point| {
                let parent_id = point.parent_id.clone().ok_or(MemoryError::MissingParent)?;
                Ok((parent_id, point.point_id.clone()))
            })
            .collect::<Result<_, MemoryError>>()?;

        for (parent_id, child_id) in links {
            self.ensure_parent_exists(&parent_id)?;
            self.attach_child(&parent_id, &child_id);
        }

        Ok(())
    }

    fn matching_points_by_type(&self, query_type: &str) -> Vec<(u32, &MemoryPoint)> {
        self.nodes
            .values()
            .filter(|point| !point.is_headless() && point.is_active())
            .filter_map(|point| {
                let score = type_match_score(point.types.as_deref()?, query_type)?;
                Some((score, point))
            })
            .collect()
    }

    fn collect_neighborhood_points(
        &self,
        matched_point_id: &str,
        relation_depth: usize,
        max_nodes: usize,
    ) -> Result<Vec<MemoryNeighborhoodPoint>, MemoryError> {
        let mut result = Vec::new();
        let mut seen = HashSet::new();

        self.collect_ancestors(
            matched_point_id,
            relation_depth,
            &mut seen,
            &mut result,
            max_nodes,
        )?;
        self.push_neighborhood_point(matched_point_id, 0, &mut seen, &mut result, max_nodes)?;
        self.collect_descendants(
            matched_point_id,
            relation_depth,
            &mut seen,
            &mut result,
            max_nodes,
        )?;

        Ok(result)
    }

    fn collect_ancestors(
        &self,
        matched_point_id: &str,
        relation_depth: usize,
        seen: &mut HashSet<String>,
        result: &mut Vec<MemoryNeighborhoodPoint>,
        max_nodes: usize,
    ) -> Result<(), MemoryError> {
        let mut ancestors = Vec::new();
        let mut current_parent = self.require_point(matched_point_id)?.parent_id.clone();

        for depth in 1..=relation_depth {
            let Some(parent_id) = current_parent else {
                break;
            };

            if parent_id == HEADLESS_POINT_ID {
                break;
            }

            let parent = self.require_point(&parent_id)?;
            ancestors.push((parent_id.clone(), -(depth as i32)));
            current_parent = parent.parent_id.clone();
        }

        for (point_id, relation_depth) in ancestors.into_iter().rev() {
            self.push_neighborhood_point(&point_id, relation_depth, seen, result, max_nodes)?;
        }

        Ok(())
    }

    fn collect_descendants(
        &self,
        matched_point_id: &str,
        relation_depth: usize,
        seen: &mut HashSet<String>,
        result: &mut Vec<MemoryNeighborhoodPoint>,
        max_nodes: usize,
    ) -> Result<(), MemoryError> {
        let mut queue = vec![(matched_point_id.to_string(), 0usize)];

        while let Some((point_id, depth)) = queue.pop() {
            if depth >= relation_depth || result.len() >= max_nodes {
                continue;
            }

            if let Some(child_ids) = self.children.get(&point_id) {
                for child_id in child_ids.iter().rev() {
                    let next_depth = depth + 1;
                    self.push_neighborhood_point(
                        child_id,
                        next_depth as i32,
                        seen,
                        result,
                        max_nodes,
                    )?;
                    queue.push((child_id.clone(), next_depth));

                    if result.len() >= max_nodes {
                        break;
                    }
                }
            }
        }

        Ok(())
    }

    fn push_neighborhood_point(
        &self,
        point_id: &str,
        relation_depth: i32,
        seen: &mut HashSet<String>,
        result: &mut Vec<MemoryNeighborhoodPoint>,
        max_nodes: usize,
    ) -> Result<(), MemoryError> {
        if result.len() >= max_nodes || !seen.insert(point_id.to_string()) {
            return Ok(());
        }

        let point = self.require_point(point_id)?;
        result.push(MemoryNeighborhoodPoint {
            point_id: point.point_id.clone(),
            parent_id: point.parent_id.clone(),
            kind: point.kind.clone(),
            relation_depth,
            storage: point.storage.clone(),
            types: point.types.clone(),
        });

        Ok(())
    }
}

impl Default for MemoryTree {
    fn default() -> Self {
        Self::new()
    }
}

fn normalize_query_types(possible_parent_types: &[String], max_parent_types: usize) -> Vec<String> {
    let mut seen = HashSet::new();
    let mut normalized = Vec::new();

    for query_type in possible_parent_types {
        let query_type = query_type.trim();
        if query_type.is_empty() {
            continue;
        }

        let key = normalize_search_term(query_type);
        if seen.insert(key) {
            normalized.push(query_type.to_string());
        }

        if normalized.len() >= max_parent_types {
            break;
        }
    }

    normalized
}

fn type_match_score(candidate_type: &str, query_type: &str) -> Option<u32> {
    let candidate = normalize_search_term(candidate_type);
    let query = normalize_search_term(query_type);

    if candidate.is_empty() || query.is_empty() {
        return None;
    }

    if candidate == query {
        return Some(1000);
    }

    if candidate.contains(&query) || query.contains(&candidate) {
        let shorter = candidate.chars().count().min(query.chars().count()) as u32;
        return Some(800 + shorter.min(100));
    }

    let simplified_candidate = simplify_search_term(&candidate);
    let simplified_query = simplify_search_term(&query);
    if !simplified_candidate.is_empty() && !simplified_query.is_empty() {
        if simplified_candidate == simplified_query {
            return Some(760);
        }
        if simplified_candidate.contains(&simplified_query)
            || simplified_query.contains(&simplified_candidate)
        {
            let shorter = simplified_candidate
                .chars()
                .count()
                .min(simplified_query.chars().count()) as u32;
            return Some(700 + shorter.min(50));
        }
    }

    if let Some(score) = semantic_type_match_score(&candidate, &query) {
        return Some(score);
    }

    let query_chars = query.chars().count();
    if query_chars <= 4 {
        let candidate_chars: HashSet<char> = candidate.chars().collect();
        let query_chars_set: HashSet<char> = query.chars().collect();
        let overlap = query_chars_set.intersection(&candidate_chars).count();
        let min_len = query_chars_set.len().min(candidate_chars.len());

        if min_len > 0 && overlap * 2 > min_len {
            return Some(400 + overlap as u32);
        }
    }

    None
}

fn semantic_type_match_score(candidate: &str, query: &str) -> Option<u32> {
    let candidate_tokens = semantic_type_tokens(candidate);
    let query_tokens = semantic_type_tokens(query);

    if candidate_tokens.is_empty() || query_tokens.is_empty() {
        return None;
    }

    let overlap = candidate_tokens.intersection(&query_tokens).count();
    if overlap == 0 {
        return None;
    }

    if query_tokens.contains("food") && !candidate_tokens.contains("food") {
        return None;
    }

    Some(560 + (overlap as u32 * 30))
}

fn semantic_type_tokens(value: &str) -> HashSet<&'static str> {
    let mut tokens = HashSet::new();

    if contains_any(
        value,
        &[
            "饮食", "食物", "食材", "面食", "菜肴", "菜品", "餐饮", "吃", "餐", "口味",
        ],
    ) {
        tokens.insert("food");
    }
    if contains_any(value, &["忌口", "过敏", "不喜欢", "避开", "不能吃"]) {
        tokens.insert("restriction");
    }
    if contains_any(
        value,
        &["前端", "界面", "设计", "ui", "颜色", "主题", "信息密度"],
    ) {
        tokens.insert("frontend_design");
    }
    if contains_any(value, &["rust", "错误", "thiserror", "anyhow"]) {
        tokens.insert("rust_error");
    }
    if contains_any(value, &["中文", "英文", "语言", "交流"]) {
        tokens.insert("language");
    }
    if contains_any(value, &["名字", "称呼", "叫我"]) {
        tokens.insert("identity");
    }

    tokens
}

fn contains_any(value: &str, terms: &[&str]) -> bool {
    terms.iter().any(|term| value.contains(term))
}

fn normalize_search_term(value: &str) -> String {
    value
        .chars()
        .filter(|ch| !ch.is_whitespace())
        .flat_map(char::to_lowercase)
        .collect()
}

fn simplify_search_term(value: &str) -> String {
    let mut simplified = value.to_string();
    for generic_term in [
        "用户",
        "我的",
        "喜欢的",
        "喜欢",
        "偏好",
        "类型",
        "种类",
        "类别",
        "信息",
        "的",
    ] {
        simplified = simplified.replace(generic_term, "");
    }
    simplified
}

fn escape_model_text(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_tree_contains_headless_only() {
        let tree = MemoryTree::new();

        assert_eq!(tree.len(), 1);
        assert_eq!(tree.memory_len(), 0);
        assert!(tree.contains(HEADLESS_POINT_ID));
        assert!(tree.validate().is_ok());
    }

    #[test]
    fn inserts_root_and_child_points() {
        let mut tree = MemoryTree::new();

        let root_id = tree
            .insert_root("likes noodles", "food preference")
            .unwrap();
        let child_id = tree
            .insert_child(&root_id, "likes zhajiangmian", "noodle preference")
            .unwrap();

        assert_eq!(tree.root_ids(), vec![root_id.clone()]);
        assert_eq!(tree.child_ids(&root_id).unwrap(), vec![child_id]);
        assert_eq!(tree.memory_len(), 2);
        assert!(tree.validate().is_ok());
    }

    #[test]
    fn updates_point_content_through_tree() {
        let mut tree = MemoryTree::new();
        let root_id = tree
            .insert_root("likes noodles", "noodle preference")
            .unwrap();

        tree.update_types(&root_id, "food preference").unwrap();
        tree.update_storage(&root_id, "likes noodles and ribs")
            .unwrap();

        let root = tree.get(&root_id).unwrap();
        assert_eq!(root.types.as_deref(), Some("food preference"));
        assert_eq!(root.storage.as_deref(), Some("likes noodles and ribs"));
    }

    #[test]
    fn reparents_point_with_index_updates() {
        let mut tree = MemoryTree::new();
        let root_a = tree.insert_root("food", "food preference").unwrap();
        let root_b = tree.insert_root("sports", "sports preference").unwrap();
        let child = tree
            .insert_child(&root_a, "likes tennis", "tennis preference")
            .unwrap();

        tree.reparent(&child, &root_b).unwrap();

        assert!(tree.child_ids(&root_a).unwrap().is_empty());
        assert_eq!(tree.child_ids(&root_b).unwrap(), vec![child.clone()]);
        assert_eq!(
            tree.get(&child).unwrap().parent_id.as_deref(),
            Some(root_b.as_str())
        );
        assert!(tree.validate().is_ok());
    }

    #[test]
    fn returns_subtree_from_start_node() {
        let mut tree = MemoryTree::new();
        let root = tree.insert_root("food", "food preference").unwrap();
        let child_a = tree
            .insert_child(&root, "likes noodles", "noodle preference")
            .unwrap();
        let child_b = tree
            .insert_child(&root, "likes ribs", "dish preference")
            .unwrap();
        let grandchild = tree
            .insert_child(&child_a, "likes zhajiangmian", "specific noodle preference")
            .unwrap();

        let subtree = tree.subtree_ids(&root).unwrap();

        assert_eq!(subtree.len(), 4);
        assert_eq!(subtree[0], root);
        assert!(subtree.contains(&child_a));
        assert!(subtree.contains(&child_b));
        assert!(subtree.contains(&grandchild));
    }

    #[test]
    fn returns_path_from_headless_to_point() {
        let mut tree = MemoryTree::new();
        let root = tree.insert_root("food", "food preference").unwrap();
        let child = tree
            .insert_child(&root, "likes noodles", "noodle preference")
            .unwrap();

        let path = tree.path_ids(&child).unwrap();

        assert_eq!(
            path,
            vec![HEADLESS_POINT_ID.to_string(), root.clone(), child.clone()]
        );
    }

    #[test]
    fn prevents_cycle_when_reparenting() {
        let mut tree = MemoryTree::new();
        let root = tree.insert_root("food", "food preference").unwrap();
        let child = tree
            .insert_child(&root, "likes noodles", "noodle preference")
            .unwrap();
        let grandchild = tree
            .insert_child(&child, "likes zhajiangmian", "specific noodle preference")
            .unwrap();

        let result = tree.reparent(&root, &grandchild);

        assert!(matches!(result, Err(MemoryError::CycleDetected { .. })));
    }

    #[test]
    fn rejects_missing_parent() {
        let mut tree = MemoryTree::new();

        let result = tree.insert_child("missing", "likes noodles", "noodle preference");

        assert!(matches!(result, Err(MemoryError::ParentNotFound { .. })));
    }

    #[test]
    fn rebuilds_tree_from_points() {
        let mut original = MemoryTree::new();
        let root = original.insert_root("food", "food preference").unwrap();
        let child = original
            .insert_child(&root, "likes noodles", "noodle preference")
            .unwrap();

        let restored = MemoryTree::from_points(original.to_points()).unwrap();

        assert_eq!(restored.memory_len(), 2);
        assert_eq!(restored.child_ids(&root).unwrap(), vec![child]);
        assert!(restored.validate().is_ok());
    }

    #[test]
    fn preserves_headless_point_when_rebuilding_from_points() {
        let mut points = MemoryTree::new().to_points();
        let headless = points
            .iter_mut()
            .find(|point| point.point_id == HEADLESS_POINT_ID)
            .unwrap();
        headless.created_at = "stable-created-at".to_string();
        headless.updated_at = "stable-updated-at".to_string();

        let restored = MemoryTree::from_points(points).unwrap();
        let restored_headless = restored.get(HEADLESS_POINT_ID).unwrap();

        assert_eq!(restored_headless.created_at, "stable-created-at");
        assert_eq!(restored_headless.updated_at, "stable-updated-at");
    }

    #[test]
    fn finds_type_neighborhood_with_parent_self_and_children() {
        let mut tree = MemoryTree::new();
        let food = tree.insert_root("用户喜欢吃面食和菜", "饮食偏好").unwrap();
        let noodles = tree
            .insert_child(&food, "用户喜欢吃炸酱面", "面食偏好")
            .unwrap();
        let zhajiangmian = tree
            .insert_child(&noodles, "用户特别喜欢炸酱面", "炸酱面偏好")
            .unwrap();
        let swimming = tree.insert_root("用户喜欢游泳", "运动偏好").unwrap();

        let options = MemoryTypeSearchOptions {
            relation_depth: 1,
            max_parent_types: 3,
            max_matches_per_type: 1,
            max_neighborhood_nodes: 16,
        };
        let neighborhoods = tree
            .find_type_neighborhoods(&["面食".to_string()], &options)
            .unwrap();

        assert_eq!(neighborhoods.len(), 1);
        assert_eq!(neighborhoods[0].matched_point_id, noodles);

        let point_ids: Vec<&str> = neighborhoods[0]
            .points
            .iter()
            .map(|point| point.point_id.as_str())
            .collect();

        assert!(point_ids.contains(&food.as_str()));
        assert!(point_ids.contains(&neighborhoods[0].matched_point_id.as_str()));
        assert!(point_ids.contains(&zhajiangmian.as_str()));
        assert!(!point_ids.contains(&swimming.as_str()));

        assert!(neighborhoods[0]
            .points
            .iter()
            .any(|point| point.point_id == food && point.relation_depth == -1));
        assert!(neighborhoods[0]
            .points
            .iter()
            .any(|point| point.point_id == zhajiangmian && point.relation_depth == 1));
    }

    #[test]
    fn limits_possible_parent_types_before_searching() {
        let mut tree = MemoryTree::new();
        let food = tree.insert_root("用户喜欢吃面食", "饮食偏好").unwrap();
        let sport = tree.insert_root("用户喜欢游泳", "运动偏好").unwrap();

        let options = MemoryTypeSearchOptions {
            relation_depth: 0,
            max_parent_types: 1,
            max_matches_per_type: 5,
            max_neighborhood_nodes: 16,
        };

        let neighborhoods = tree
            .find_type_neighborhoods(&["饮食".to_string(), "运动".to_string()], &options)
            .unwrap();

        assert_eq!(neighborhoods.len(), 1);
        assert_eq!(neighborhoods[0].matched_point_id, food);
        assert_ne!(neighborhoods[0].matched_point_id, sport);
    }

    #[test]
    fn formats_type_neighborhoods_for_model() {
        let mut tree = MemoryTree::new();
        let food = tree.insert_root("用户喜欢吃面食", "饮食偏好").unwrap();
        let options = MemoryTypeSearchOptions::default();
        let neighborhoods = tree
            .find_type_neighborhoods(&["饮食".to_string()], &options)
            .unwrap();

        let formatted = MemoryTree::format_type_neighborhoods_for_model(&neighborhoods);

        assert!(formatted.contains("<existing-memory-candidates>"));
        assert!(formatted.contains(&food));
        assert!(formatted.contains("饮食偏好"));
        assert!(formatted.contains("用户喜欢吃面食"));
    }

    #[test]
    fn falls_back_to_roots_when_type_search_has_no_matches() {
        let mut tree = MemoryTree::new();
        let noodles = tree
            .insert_root("用户喜欢吃炸酱面", "用户喜欢的面食")
            .unwrap();
        let swimming = tree.insert_root("用户喜欢游泳", "运动偏好").unwrap();
        let options = MemoryTypeSearchOptions {
            relation_depth: 0,
            max_parent_types: 3,
            max_matches_per_type: 1,
            max_neighborhood_nodes: 16,
        };

        let neighborhoods = tree
            .find_type_neighborhoods(&["菜肴偏好".to_string()], &options)
            .unwrap();

        assert_eq!(neighborhoods.len(), 1);
        assert_eq!(neighborhoods[0].matched_point_id, noodles);
        assert_ne!(neighborhoods[0].matched_point_id, swimming);
    }

    #[test]
    fn recalls_storage_from_matched_subtree() {
        let mut tree = MemoryTree::new();
        let food = tree
            .insert_root("用户喜欢吃炸酱面和糖醋排骨等食物", "用户喜欢的食物")
            .unwrap();
        let ribs = tree
            .insert_child(&food, "用户喜欢吃糖醋排骨", "用户喜欢吃的菜")
            .unwrap();
        let _noodles = tree
            .insert_child(&food, "用户喜欢吃炸酱面", "用户喜欢吃的面食")
            .unwrap();
        let _sport = tree.insert_root("用户周末喜欢跑步", "运动习惯").unwrap();

        let branches = tree
            .recall_subtree_memories(
                &["食物偏好".to_string()],
                &MemoryRecallOptions {
                    max_types: 3,
                    max_matches_per_type: 2,
                    max_returned_memories: 16,
                },
            )
            .unwrap();

        assert_eq!(branches.len(), 1);
        assert_eq!(branches[0].matched_point_id, food);
        assert!(branches[0]
            .memories
            .contains(&"用户喜欢吃炸酱面和糖醋排骨等食物".to_string()));
        assert!(branches[0]
            .memories
            .contains(&"用户喜欢吃糖醋排骨".to_string()));
        assert!(branches[0]
            .memories
            .contains(&"用户喜欢吃炸酱面".to_string()));
        assert!(!branches[0]
            .memories
            .contains(&"用户周末喜欢跑步".to_string()));

        tree.deactivate(&ribs).unwrap();
        let branches = tree
            .recall_subtree_memories(&["食物偏好".to_string()], &MemoryRecallOptions::default())
            .unwrap();
        assert!(!branches[0]
            .memories
            .contains(&"用户喜欢吃糖醋排骨".to_string()));
    }

    #[test]
    fn recalls_related_food_roots_by_semantic_type() {
        let mut tree = MemoryTree::new();
        tree.insert_root("用户喜欢吃炸酱面", "用户喜欢吃的面食")
            .unwrap();
        tree.insert_root("用户不喜欢吃香菜", "用户不喜欢的食材")
            .unwrap();
        tree.insert_root("用户对花生过敏，饮食建议必须避开花生", "食物过敏信息")
            .unwrap();
        tree.insert_root("用户周末喜欢跑步", "运动习惯").unwrap();

        let branches = tree
            .recall_subtree_memories(
                &["饮食偏好".to_string(), "忌口偏好".to_string()],
                &MemoryRecallOptions {
                    max_types: 3,
                    max_matches_per_type: 8,
                    max_returned_memories: 16,
                },
            )
            .unwrap();
        let memories = branches
            .iter()
            .flat_map(|branch| branch.memories.iter())
            .cloned()
            .collect::<Vec<_>>()
            .join("\n");

        assert!(memories.contains("炸酱面"));
        assert!(memories.contains("香菜"));
        assert!(memories.contains("花生"));
        assert!(!memories.contains("跑步"));
    }
}
