// Origin: app/backend/core/src/plugin_slide_markdown/tests.rs::projections_preserve_component_content_and_relationships
use super::*;


#[test]
pub(super) fn projections_preserve_component_content_and_relationships() {
    let cases = vec![
        ("contents", json!({"presentation":"capability","title":"Capabilities","items":[{"id":"stable-entry","title":"Plan","text":"Scope","icon":"Target","bullets":["Detail A","Detail B"]}]}), vec!["capability","Capabilities","Plan","Scope","Target","Detail A","Detail B"]),
        ("image-text", json!({"src":"https://example.com/image.png","alt":"Image","title":"Research","text":"Understand needs"}), vec!["Research","Understand needs","Image"]),
        ("icon-text", json!({"icon":"Target","title":"Goal","text":"Define scope"}), vec!["Goal","Define scope"]),
        (
            "hero",
            json!({"title":"标题","eyebrow":"眉题","subtitle":"副题"}),
            vec!["标题", "眉题", "副题"],
        ),
        (
            "heading",
            json!({"text":"标题","kicker":"引导"}),
            vec!["标题", "引导"],
        ),
        ("text", json!({"text":"正文"}), vec!["正文"]),
        ("notice", json!({"text":"注意事项"}), vec!["注意事项"]),
        (
            "quote",
            json!({"text":"观点","source":"作者"}),
            vec!["观点", "作者"],
        ),
        (
            "stat",
            json!({"value":42,"label":"增长","description":"同比"}),
            vec!["42", "增长", "同比"],
        ),
        (
            "question-card",
            json!({"title":"问题","text":"回答","index":5}),
            vec!["问题", "回答", "5"],
        ),
        (
            "media",
            json!({"src":"https://private.example/image","alt":"产品照片"}),
            vec!["产品照片", "未提取"],
        ),
        (
            "code-block",
            json!({"code":"let x = 42;","language":"javascript"}),
            vec!["```javascript", "let x = 42;"],
        ),
        (
            "math-formula",
            json!({"content":{"formula":"x^2 + y^2 = z^2"}}),
            vec!["x^2 + y^2 = z^2"],
        ),
        ("list", json!({"items":["甲","乙"]}), vec!["- 甲", "- 乙"]),
        (
            "ordered-list",
            json!({"items":["甲","乙"]}),
            vec!["1. 甲", "2. 乙"],
        ),
        (
            "todo-list",
            json!({"items":[{"text":"甲","checked":true},{"text":"乙","checked":false}]}),
            vec!["- [x] 甲", "- [ ] 乙"],
        ),
        (
            "item-cards",
            json!({"items":[{"title":"卡片一","text":"解释一"}]}),
            vec!["卡片一", "解释一"],
        ),
        (
            "capability-cards",
            json!({"content":{"items":[{"title":"能力","text":"解释"}]}}),
            vec!["能力", "解释"],
        ),
        (
            "numbered-icon-cards",
            json!({"content":{"items":[{"title":"合作","text":"共赢","icon":"Rocket"}]}}),
            vec!["合作", "共赢"],
        ),
        (
            "shape-contents",
            json!({"variant":"stairs","items":[{"title":"计划","text":"确认目标"},{"title":"交付","text":"验收结果"}]}),
            vec!["计划", "确认目标", "交付", "验收结果"],
        ),
        (
            "table",
            json!({"content":{"columns":[{"header":"营收"},{"header":"说明"}],"rows":[{"cells":[42,{"text":"增长"}]}]}}),
            vec!["| 营收 | 说明 |", "| 42 | 增长 |"],
        ),
        (
            "grouped-bar-chart",
            json!({"subtitle":"本季","content":{"categories":["华东"],"series":[{"name":"实际","data":[118]}],"valueSuffix":"万元"}}),
            vec!["本季", "万元", "| 类别 | 实际 |", "| 华东 | 118 |"],
        ),
        (
            "line-chart",
            json!({"content":{"categories":["一月"],"series":[{"name":"差额","data":[-5],"labels":[{"index":0,"text":"下降"}]}]}}),
            vec!["| 一月 | -5 |", "标注类别：一月", "下降"],
        ),
        (
            "stacked-bar-chart",
            json!({"content":{"categories":["甲","乙"],"series":[{"name":"销售","data":[4,5]}],"annotation":{"label":"比较","from":0,"to":1}}}),
            vec!["| 甲 | 4 |", "| 乙 | 5 |", "起始类别：甲", "结束类别：乙"],
        ),
        (
            "radar-chart",
            json!({"content":{"axes":[{"label":"质量","max":10}],"datasets":[{"name":"团队","values":[8]}]}}),
            vec!["| 类别 | 轴上限 | 团队 |", "| 质量 | 10 | 8 |"],
        ),
        (
            "donut-chart",
            json!({"content":{"items":[{"label":"业务","value":42,"percentLabel":"42%","valueLabel":"四十二","detailLabel":"经营收入","badge":"主项"}],"center":{"title":["合计","营收"],"value":100,"subtitle":"年度","eyebrow":"总览"},"tag":"领先","footerLines":["说明"],"footnotes":[{"text":"注释","lines":["补充"]}]}}),
            vec![
                "42",
                "四十二",
                "42%",
                "经营收入",
                "主项",
                "合计",
                "100",
                "年度",
                "总览",
                "领先",
                "说明",
                "注释",
                "补充",
            ],
        ),
        (
            "risk-matrix",
            json!({"content":{"xLabel":"概率","yLabel":"影响","items":[{"label":"延期","x":0.2,"y":0.8}],"priorityZone":{"x":0.5,"y":0.5,"width":0.4,"height":0.4,"label":"重点"}}}),
            vec!["概率", "影响", "| 延期 | 0.2 | 0.8 |", "重点"],
        ),
        (
            "waterfall-chart",
            json!({"content":{"items":[{"label":"基数","value":100,"type":"total"},{"label":"损耗","value":-8}],"callouts":[{"index":1,"text":"下降"}],"comparisons":[{"from":0,"to":1,"label":"差额"}],"footnote":"备注"}}),
            vec![
                "| 基数 | 100 | 合计 |",
                "| 损耗 | -8 | 变化量 |",
                "标注项目：损耗",
                "差额",
                "备注",
            ],
        ),

    ];
    assert_eq!(
        cases.len(),
        crate::presentation::schema::contract::component_types().len()
    );
    for (kind, props, expected) in cases {
        let out = output(vec![node(kind, props)]);
        for text in expected {
            assert!(out.contains(text), "{kind} missing {text}: {out}");
        }
        assert!(!out.contains("https://"));
    }
}
