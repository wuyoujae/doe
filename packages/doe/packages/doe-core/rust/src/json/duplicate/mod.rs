use serde::de::{Deserialize, Deserializer, Error, MapAccess, SeqAccess, Visitor};

use serde_json::{Map, Number, Value};

use std::fmt;


#[derive(Debug, Clone)]
pub struct DuplicateAwareJson {
    pub value: Value,
    pub equal_paths: Vec<String>,
    pub conflicting_paths: Vec<String>,
}
#[path = "parse/mod.rs"]
mod function_parse;
pub use function_parse::parse;

#[path = "parse-strict/mod.rs"]
mod function_parse_strict;
pub use function_parse_strict::parse_strict;



impl<'de> Deserialize<'de> for DuplicateAwareJson {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        deserializer.deserialize_any(DuplicateAwareVisitor)
    }
}


struct DuplicateAwareVisitor;


impl<'de> Visitor<'de> for DuplicateAwareVisitor {
    type Value = DuplicateAwareJson;

    fn expecting(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("a JSON value")
    }

    fn visit_bool<E>(self, value: bool) -> Result<Self::Value, E> {
        Ok(leaf(Value::Bool(value)))
    }

    fn visit_i64<E>(self, value: i64) -> Result<Self::Value, E> {
        Ok(leaf(Value::Number(Number::from(value))))
    }

    fn visit_u64<E>(self, value: u64) -> Result<Self::Value, E> {
        Ok(leaf(Value::Number(Number::from(value))))
    }

    fn visit_f64<E>(self, value: f64) -> Result<Self::Value, E>
    where
        E: Error,
    {
        let number = Number::from_f64(value).ok_or_else(|| E::custom("non-finite JSON number"))?;
        Ok(leaf(Value::Number(number)))
    }

    fn visit_str<E>(self, value: &str) -> Result<Self::Value, E> {
        Ok(leaf(Value::String(value.to_string())))
    }

    fn visit_string<E>(self, value: String) -> Result<Self::Value, E> {
        Ok(leaf(Value::String(value)))
    }

    fn visit_none<E>(self) -> Result<Self::Value, E> {
        Ok(leaf(Value::Null))
    }

    fn visit_unit<E>(self) -> Result<Self::Value, E> {
        Ok(leaf(Value::Null))
    }

    fn visit_some<D>(self, deserializer: D) -> Result<Self::Value, D::Error>
    where
        D: Deserializer<'de>,
    {
        DuplicateAwareJson::deserialize(deserializer)
    }

    fn visit_seq<A>(self, mut sequence: A) -> Result<Self::Value, A::Error>
    where
        A: SeqAccess<'de>,
    {
        let mut values = Vec::new();
        let mut equal_paths = Vec::new();
        let mut conflicting_paths = Vec::new();
        while let Some(mut child) = sequence.next_element::<DuplicateAwareJson>()? {
            let prefix = format!("/{}", values.len());
            prefix_paths(&prefix, &mut child.equal_paths);
            prefix_paths(&prefix, &mut child.conflicting_paths);
            equal_paths.extend(child.equal_paths);
            conflicting_paths.extend(child.conflicting_paths);
            values.push(child.value);
        }
        Ok(DuplicateAwareJson {
            value: Value::Array(values),
            equal_paths,
            conflicting_paths,
        })
    }

    fn visit_map<A>(self, mut map: A) -> Result<Self::Value, A::Error>
    where
        A: MapAccess<'de>,
    {
        let mut object = Map::new();
        let mut equal_paths = Vec::new();
        let mut conflicting_paths = Vec::new();
        while let Some(key) = map.next_key::<String>()? {
            let mut child = map.next_value::<DuplicateAwareJson>()?;
            let path = format!("/{}", escape_json_pointer_segment(&key));
            prefix_paths(&path, &mut child.equal_paths);
            prefix_paths(&path, &mut child.conflicting_paths);
            equal_paths.extend(child.equal_paths);
            conflicting_paths.extend(child.conflicting_paths);
            if let Some(existing) = object.get(&key) {
                if existing == &child.value {
                    equal_paths.push(path);
                } else {
                    conflicting_paths.push(path);
                }
                continue;
            }
            object.insert(key, child.value);
        }
        Ok(DuplicateAwareJson {
            value: Value::Object(object),
            equal_paths,
            conflicting_paths,
        })
    }
}
#[path = "leaf/mod.rs"]
mod function_leaf;
 use function_leaf::leaf;

#[path = "prefix-paths/mod.rs"]
mod function_prefix_paths;
 use function_prefix_paths::prefix_paths;

#[path = "escape-json-pointer-segment/mod.rs"]
mod function_escape_json_pointer_segment;
 use function_escape_json_pointer_segment::escape_json_pointer_segment;



#[cfg(test)]
#[path = "tests/mod.rs"]
mod tests;

