pub mod error;
pub mod storage;
pub mod tree;
pub mod types;

pub use error::MemoryError;
pub use storage::{
    clear_memory_storage_root, memory_storage_path, read_memory_tree, set_memory_storage_root,
    write_memory_tree, MemoryStorageFile,
};
pub use tree::{
    MemoryNeighborhoodPoint, MemoryRecallBranch, MemoryRecallOptions, MemoryTree,
    MemoryTypeNeighborhood, MemoryTypeSearchOptions,
};
pub use types::{MemoryPoint, MemoryPointKind, MemoryPointStatus, HEADLESS_POINT_ID};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn creates_valid_headless_point() {
        let point = MemoryPoint::headless();

        assert_eq!(point.point_id, HEADLESS_POINT_ID);
        assert!(point.is_headless());
        assert!(point.storage.is_none());
        assert!(point.types.is_none());
        assert!(point.validate().is_ok());
    }

    #[test]
    fn creates_root_point_under_headless() {
        let point = MemoryPoint::new_root("用户比较喜欢吃炸酱面", "用户喜欢吃的面食").unwrap();

        assert_eq!(point.kind, MemoryPointKind::Root);
        assert_eq!(point.parent_id.as_deref(), Some(HEADLESS_POINT_ID));
        assert_eq!(point.storage.as_deref(), Some("用户比较喜欢吃炸酱面"));
        assert_eq!(point.types.as_deref(), Some("用户喜欢吃的面食"));
        assert!(point.validate().is_ok());
    }

    #[test]
    fn creates_child_point() {
        let point =
            MemoryPoint::new_child("parent-1", "用户比较喜欢吃糖醋排骨", "用户喜欢吃的菜").unwrap();

        assert_eq!(point.kind, MemoryPointKind::Point);
        assert_eq!(point.parent_id.as_deref(), Some("parent-1"));
        assert!(point.validate().is_ok());
    }

    #[test]
    fn updates_types_and_storage() {
        let mut point = MemoryPoint::new_root("用户比较喜欢吃炸酱面", "用户喜欢吃的面食").unwrap();

        point.update_types("用户喜欢吃的食物").unwrap();
        point
            .update_storage("用户喜欢吃炸酱面、糖醋排骨等食物")
            .unwrap();

        assert_eq!(point.types.as_deref(), Some("用户喜欢吃的食物"));
        assert_eq!(
            point.storage.as_deref(),
            Some("用户喜欢吃炸酱面、糖醋排骨等食物")
        );
    }

    #[test]
    fn prevents_headless_modification() {
        let mut point = MemoryPoint::headless();

        let result = point.update_types("anything");

        assert!(matches!(
            result,
            Err(MemoryError::HeadlessModification {
                operation: "update_types"
            })
        ));
    }

    #[test]
    fn reparenting_updates_kind() {
        let mut point =
            MemoryPoint::new_child("parent-1", "用户比较喜欢吃糖醋排骨", "用户喜欢吃的菜").unwrap();

        point.set_parent(HEADLESS_POINT_ID).unwrap();
        assert_eq!(point.kind, MemoryPointKind::Root);

        point.set_parent("another-parent").unwrap();
        assert_eq!(point.kind, MemoryPointKind::Point);
    }

    #[test]
    fn rejects_empty_storage_and_types() {
        let storage_result = MemoryPoint::new_root("", "用户喜欢吃的面食");
        let types_result = MemoryPoint::new_root("用户比较喜欢吃炸酱面", " ");

        assert!(matches!(
            storage_result,
            Err(MemoryError::EmptyField { field: "storage" })
        ));
        assert!(matches!(
            types_result,
            Err(MemoryError::EmptyField { field: "types" })
        ));
    }

    #[test]
    fn supports_custom_attributes() {
        let mut point = MemoryPoint::new_root("用户比较喜欢吃炸酱面", "用户喜欢吃的面食").unwrap();

        point
            .set_attribute("confidence", serde_json::json!(0.92))
            .unwrap();

        assert_eq!(point.attributes["confidence"], serde_json::json!(0.92));
        assert_eq!(
            point.remove_attribute("confidence"),
            Some(serde_json::json!(0.92))
        );
    }
}
