// Origin: app/backend/core/src/outline_recovery/contract.rs::component_machine_rules
use super::*;


pub(super) fn component_machine_rules() -> Value {
    json!({
        "text_block": {"paragraphs": "1..100 non-empty strings"},
        "metric": {"label": "non-empty string", "value": "string|finite_number", "unit|period|comparison": "optional non-empty string"},
        "metrics": {"items": "1..100 metric objects without nested type"},
        "timeline": {"events": "1..100 exact objects {time:string|finite_number,title:string,detail:string}"},
        "process": {"steps": "1..100 exact objects {order:positive_integer,title:string,detail:string}"},
        "strengths": {"items": "1..100 exact objects {title:string,text:string}"},
        "comparison": {"dimensions": "1..100 strings", "items": "1..100 exact objects {name:string,values:[string|finite_number|null]}", "constraint": "values length equals dimensions length"},
        "table": {"columns": "1..100 unique semantic keys with labels", "rows": "1..100 objects whose exact key set equals column keys", "cell": "string|number|boolean|null"},
        "illustrated_items": {"items": "2..4 exact objects {title:string,text:string,image:image|generated_image}"},
        "image": {"src": "direct https URL", "ratio": ["16:9", "4:3", "3:4", "1:1", "9:16"], "role": "non-empty string"},
        "generated_image": {"src": "GENRATEIMG(description)|yrkie-asset-data://sha256|https URL", "ratio": ["16:9", "4:3", "3:4", "1:1", "9:16"], "role": "non-empty string"}
    })
}
