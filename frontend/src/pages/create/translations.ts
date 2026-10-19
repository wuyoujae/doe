// Create UI strings retained from 98cbdd57; local draft copy describes this extraction.
export const createTranslations = {
  "en": {
    "dashboard": {
      "newMasterpiece": "New Masterpiece",
      "deckFormat": {
        "presentationS": "Presentation-S"
      },
      "create": {
        "title": "What will you create?",
        "greetingMorning": "Good morning, {{name}}",
        "greetingAfternoon": "Good afternoon, {{name}}",
        "greetingEvening": "Good evening, {{name}}",
        "greetingGoodToSee": "Good to see you, {{name}}.",
        "greetingWelcomeBack": "Welcome back, {{name}}.",
        "greetingReady": "Ready to create, {{name}}?",
        "greetingIdeas": "Any new ideas, {{name}}?",
        "greetingMake": "Let’s make something, {{name}}.",
        "greetingFresh": "A fresh start, {{name}}.",
        "greetingTakeYourTime": "Take your time, {{name}}.",
        "promptLabel": "Masterpiece prompt",
        "inventorPlaceholder": "Describe your universe.",
        "shortcut": "Ctrl + Enter"
      }
    },
    "createExamples": {
      "startHint": "Start from a demo",
      "label": "Explore prompt examples",
      "close": "Close examples",
      "prompt": "Create a presentation about “{{topic}}”. {{direction}} Start with the audience, the decision they need to make, and a clear central message. Build a coherent 8–12 slide narrative with a concise title, key points, suggested visual, and speaker notes for each slide. Use only the facts and materials I provide; clearly mark missing information and illustrative assumptions instead of inventing numbers or sources. Finish with practical next steps. If essential context is missing, ask me up to three focused questions before drafting.",
      "categories": {
        "finance": {
          "label": "Finance",
          "direction": "Write for financial decision makers. Organize the topic around relevant performance drivers, cash flow, scenarios and risks; explain the measurement period and calculation basis. Separate historical results, forecasts and assumptions, and identify what evidence is needed to support each conclusion.",
          "examples": {
            "0": "Quarterly financial performance",
            "1": "Industry investment research",
            "2": "Business risk assessment",
            "3": "Annual budget planning",
            "4": "Cash flow analysis"
          }
        },
        "consulting": {
          "label": "Consulting",
          "direction": "Write for a client leadership team. Define the business question and scope, diagnose root causes, compare feasible options, and develop a prioritized recommendation. Include implementation milestones, responsible roles and success measures; distinguish evidence from hypotheses.",
          "examples": {
            "0": "Market entry strategy",
            "1": "Business model diagnosis",
            "2": "Digital transformation roadmap",
            "3": "Organizational efficiency",
            "4": "Consulting project review"
          }
        },
        "sales": {
          "label": "Sales",
          "direction": "Write for a prospective or existing customer. Start with their specific problem, show the relevant use cases and value, support claims with supplied evidence, address common objections, and end with a concrete next step. Avoid invented customer stories, savings or performance guarantees.",
          "examples": {
            "0": "Enterprise sales proposal",
            "1": "Product demo narrative",
            "2": "Customer success review",
            "3": "Competitive comparison",
            "4": "Sales team training"
          }
        },
        "education": {
          "label": "Education",
          "direction": "Write for the relevant learners or education stakeholders. Specify the intended audience and learning objectives, explain the key ideas progressively, and include an example, an interactive activity and a way to check understanding. Adapt the depth and vocabulary to the audience.",
          "examples": {
            "0": "A lesson that makes concepts clear",
            "1": "School enrollment presentation",
            "2": "Employee training workshop",
            "3": "Learning outcomes showcase",
            "4": "Course curriculum design"
          }
        },
        "healthcare": {
          "label": "Healthcare",
          "direction": "Write for the audience appropriate to this healthcare topic. Explain the context, reliable evidence, practical process and key limitations. Use approved, de-identified materials; mark the date and source of medical claims, avoid fabricated clinical results, and do not provide personalized diagnosis or treatment instructions.",
          "examples": {
            "0": "Patient health education",
            "1": "Hospital department introduction",
            "2": "Clinical research explainer",
            "3": "Healthcare service journey",
            "4": "Healthcare quality improvement"
          }
        },
        "fundraising": {
          "label": "Fundraising",
          "direction": "Write for investors evaluating this company. Connect the customer problem, solution, market, differentiation, business model, traction, team and funding plan as relevant to the topic. Distinguish actual metrics from projections, show assumptions and milestones, and do not invent customers or market-size figures.",
          "examples": {
            "0": "Seed-stage pitch deck",
            "1": "Series A growth story",
            "2": "Business model investor pitch",
            "3": "Quarterly investor update",
            "4": "Funding allocation and milestones"
          }
        },
        "general": {
          "label": "General",
          "direction": "Define the audience and desired outcome for this topic. Organize the material into a clear beginning, structured analysis and an actionable conclusion. Use concrete examples and suitable charts or diagrams, state dependencies and open questions, and keep each slide focused on one main idea.",
          "examples": {
            "0": "Project kickoff",
            "1": "Annual review",
            "2": "Product launch",
            "3": "Event proposal",
            "4": "Personal portfolio"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "Local draft · AI generation is not connected yet",
      "createDraft": "Create local draft",
      "failed": "Could not save the draft. Please try again.",
      "recentTitle": "Recent presentations",
      "recentLoading": "Loading presentations…",
      "recentFailed": "Could not load local presentations.",
      "retry": "Retry",
      "untitled": "Untitled presentation",
      "showMore": "Show more"
    }
  },
  "zh-CN": {
    "dashboard": {
      "newMasterpiece": "新建作品",
      "deckFormat": {
        "presentationS": "幻灯片"
      },
      "create": {
        "title": "你想创作什么？",
        "greetingMorning": "早上好，{{name}}",
        "greetingAfternoon": "下午好，{{name}}",
        "greetingEvening": "晚上好，{{name}}",
        "greetingGoodToSee": "见到你真好，{{name}}。",
        "greetingWelcomeBack": "欢迎回来，{{name}}。",
        "greetingReady": "准备好创作了吗，{{name}}？",
        "greetingIdeas": "今天有什么新点子，{{name}}？",
        "greetingMake": "一起创作点什么吧，{{name}}。",
        "greetingFresh": "新的开始，{{name}}。",
        "greetingTakeYourTime": "慢慢来，{{name}}。",
        "promptLabel": "作品提示词",
        "inventorPlaceholder": "描述你的创意世界。",
        "shortcut": "Ctrl + Enter"
      }
    },
    "createExamples": {
      "startHint": "点击这些例子快速开始",
      "label": "探索提示词示例",
      "close": "关闭示例",
      "prompt": "请围绕“{{topic}}”制作一份演示文稿。{{direction}} 先明确目标受众、他们需要做出的决策，以及整份内容的核心观点，再组织成逻辑连贯的 8–12 页内容。每页提供简洁标题、关键信息、合适的图表或示意图建议，以及演讲备注。只使用我提供的事实和材料，缺失的信息明确标注为待补充，示意数据与假设必须说明，不要编造数字或来源。最后给出可执行的下一步。如果缺少必要背景，请先向我提出不超过三个具体问题，再开始撰写。",
      "categories": {
        "finance": {
          "label": "金融",
          "direction": "面向财务或投资决策者，根据主题梳理业绩驱动因素、现金流、情景分析与风险，交代统计周期和指标口径。清晰区分历史结果、预测和假设，说明结论所需的证据，并突出需要讨论或决策的问题。",
          "examples": {
            "0": "季度财务业绩复盘",
            "1": "行业投资研究",
            "2": "企业风险评估",
            "3": "年度预算规划",
            "4": "现金流分析"
          }
        },
        "consulting": {
          "label": "咨询",
          "direction": "面向客户管理层，明确业务问题和分析范围，诊断根因，对比可行方案，形成有优先级的建议。补充实施里程碑、责任角色及衡量成效的指标，区分已验证事实和待验证假设。",
          "examples": {
            "0": "新市场进入策略",
            "1": "商业模式诊断",
            "2": "数字化转型路线图",
            "3": "组织效率提升",
            "4": "咨询项目复盘"
          }
        },
        "sales": {
          "label": "销售",
          "direction": "面向潜在或现有客户，从具体痛点出发，展示相关使用场景、产品价值和已有证据，回应常见异议，并明确下一步行动。不要虚构客户案例、节省金额或效果保证。",
          "examples": {
            "0": "企业客户销售提案",
            "1": "产品演示故事线",
            "2": "客户成功复盘",
            "3": "竞品对比分析",
            "4": "销售团队培训"
          }
        },
        "education": {
          "label": "教培",
          "direction": "根据主题明确学习者或教育相关受众，设定学习目标，由浅入深讲解概念，配合具体案例、互动练习和理解检查。让内容深度、术语与活动难度适合受众，说明预期学习成果。",
          "examples": {
            "0": "把知识讲清楚的课程",
            "1": "学校招生宣讲",
            "2": "企业员工培训",
            "3": "学习成果展示",
            "4": "课程体系设计"
          }
        },
        "healthcare": {
          "label": "医疗",
          "direction": "根据主题确定患者、医务人员或管理者等受众，解释背景、可靠证据、实际流程与适用边界。使用经过批准且去标识化的材料，医学结论注明资料日期和来源，不编造临床结果，不提供个体化诊断或治疗指令。",
          "examples": {
            "0": "患者健康科普",
            "1": "医院科室介绍",
            "2": "临床研究解读",
            "3": "医疗服务流程介绍",
            "4": "医疗质量改进"
          }
        },
        "fundraising": {
          "label": "融资",
          "direction": "面向评估公司的投资人，按主题串联客户问题、解决方案、市场、差异化、商业模式、增长验证、团队和融资计划。真实业绩与预测分开，写清假设及里程碑，不虚构客户或市场规模。",
          "examples": {
            "0": "种子轮融资路演",
            "1": "A 轮增长故事",
            "2": "商业模式投资人路演",
            "3": "投资人季度更新",
            "4": "融资用途与里程碑"
          }
        },
        "general": {
          "label": "通用",
          "direction": "明确该主题的目标受众和预期成果，用清楚的开场、有层次的分析和可执行的结论组织内容。提供具体案例及合适的图表，说明依赖条件和待解决问题，每页只突出一个核心观点。",
          "examples": {
            "0": "项目启动会",
            "1": "年度工作总结",
            "2": "产品发布介绍",
            "3": "活动策划提案",
            "4": "个人作品集"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "本地草稿 · AI 生成尚未接入",
      "createDraft": "创建本地草稿",
      "failed": "草稿保存失败，请重试。",
      "recentTitle": "最近文稿",
      "recentLoading": "正在读取文稿…",
      "recentFailed": "无法读取本地文稿。",
      "retry": "重试",
      "untitled": "未命名文稿",
      "showMore": "显示更多"
    }
  },
  "zh-TW": {
    "dashboard": {
      "newMasterpiece": "新增作品",
      "deckFormat": {
        "presentationS": "幻燈片"
      },
      "create": {
        "title": "你想創作什麼？",
        "greetingMorning": "早安，{{name}}",
        "greetingAfternoon": "午安，{{name}}",
        "greetingEvening": "晚安，{{name}}",
        "greetingGoodToSee": "見到你真好，{{name}}。",
        "greetingWelcomeBack": "歡迎回來，{{name}}。",
        "greetingReady": "準備好創作了嗎，{{name}}？",
        "greetingIdeas": "今天有什麼新點子，{{name}}？",
        "greetingMake": "一起創作點什麼吧，{{name}}。",
        "greetingFresh": "新的開始，{{name}}。",
        "greetingTakeYourTime": "慢慢來，{{name}}。",
        "promptLabel": "作品提示詞",
        "inventorPlaceholder": "描述你的創意世界。",
        "shortcut": "Ctrl + Enter"
      }
    },
    "createExamples": {
      "startHint": "點擊這些例子快速開始",
      "label": "探索提示詞範例",
      "close": "關閉範例",
      "prompt": "請圍繞「{{topic}}」製作一份簡報。{{direction}} 先明確目標受眾、他們需要做出的決策，以及整份內容的核心觀點，再組織成邏輯連貫的 8–12 頁內容。每頁提供簡潔標題、關鍵資訊、合適的圖表或示意圖建議，以及演講備註。只使用我提供的事實和材料，缺少的資訊明確標為待補充，示意數據與假設必須說明，不要編造數字或來源。最後給出可執行的下一步。如果缺少必要背景，請先向我提出不超過三個具體問題，再開始撰寫。",
      "categories": {
        "finance": {
          "label": "金融",
          "direction": "面向財務或投資決策者，依主題梳理業績驅動因素、現金流、情境分析與風險，交代統計期間和指標定義。區分歷史結果、預測與假設，說明結論需要哪些證據。",
          "examples": {
            "0": "季度財務業績回顧",
            "1": "產業投資研究",
            "2": "企業風險評估",
            "3": "年度預算規劃",
            "4": "現金流分析"
          }
        },
        "consulting": {
          "label": "顧問",
          "direction": "面向客戶管理階層，明確業務問題和範圍，診斷根因、比較可行方案並排列建議優先順序。補充實施里程碑、負責角色和成效指標，區分事實與假設。",
          "examples": {
            "0": "新市場進入策略",
            "1": "商業模式診斷",
            "2": "數位轉型路線圖",
            "3": "組織效率提升",
            "4": "顧問專案回顧"
          }
        },
        "sales": {
          "label": "銷售",
          "direction": "面向潛在或現有客戶，從具體痛點出發，展示使用情境、產品價值與已有證據，回應常見疑慮，明確下一步。不要虛構客戶案例、節省金額或成效保證。",
          "examples": {
            "0": "企業客戶銷售提案",
            "1": "產品展示故事線",
            "2": "客戶成功回顧",
            "3": "競品比較分析",
            "4": "銷售團隊培訓"
          }
        },
        "education": {
          "label": "教育培訓",
          "direction": "依主題確定學習者或教育相關受眾，設定學習目標，由淺入深講解概念，搭配案例、互動練習與理解檢核，讓深度和詞彙適合受眾。",
          "examples": {
            "0": "把知識講清楚的課程",
            "1": "學校招生說明",
            "2": "企業員工培訓",
            "3": "學習成果展示",
            "4": "課程體系設計"
          }
        },
        "healthcare": {
          "label": "醫療",
          "direction": "依主題確定患者、醫務人員或管理者等受眾，解釋背景、可靠證據、實際流程與適用限制。使用經核准且去識別化的材料，醫學主張註明日期與來源，不編造臨床結果，不提供個人診斷或治療指令。",
          "examples": {
            "0": "患者健康衛教",
            "1": "醫院科室介紹",
            "2": "臨床研究解讀",
            "3": "醫療服務流程介紹",
            "4": "醫療品質改善"
          }
        },
        "fundraising": {
          "label": "募資",
          "direction": "面向投資人，依主題串聯客戶問題、解決方案、市場、差異化、商業模式、成長驗證、團隊與募資計畫。區分真實業績與預測，說明假設和里程碑，不虛構客戶或市場規模。",
          "examples": {
            "0": "種子輪募資簡報",
            "1": "A 輪成長故事",
            "2": "商業模式投資人簡報",
            "3": "投資人季度更新",
            "4": "募資用途與里程碑"
          }
        },
        "general": {
          "label": "通用",
          "direction": "明確目標受眾和預期成果，以清楚的開場、有層次的分析和可執行的結論組織內容。提供具體案例與圖表，說明依賴條件及待解問題，每頁突出一個核心觀點。",
          "examples": {
            "0": "專案啟動會",
            "1": "年度工作總結",
            "2": "產品發表介紹",
            "3": "活動企劃提案",
            "4": "個人作品集"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "本機草稿 · AI 生成尚未接入",
      "createDraft": "建立本機草稿",
      "failed": "草稿儲存失敗，請重試。",
      "recentTitle": "最近文稿",
      "recentLoading": "正在讀取文稿…",
      "recentFailed": "無法讀取本機文稿。",
      "retry": "重試",
      "untitled": "未命名文稿",
      "showMore": "顯示更多"
    }
  },
  "es": {
    "dashboard": {
      "newMasterpiece": "Nueva obra",
      "deckFormat": {
        "presentationS": "Presentation-S"
      },
      "create": {
        "title": "¿Qué vas a crear?",
        "greetingMorning": "Buenos días, {{name}}",
        "greetingAfternoon": "Buenas tardes, {{name}}",
        "greetingEvening": "Buenas noches, {{name}}",
        "greetingGoodToSee": "Qué gusto verte, {{name}}.",
        "greetingWelcomeBack": "Qué bueno tenerte de vuelta, {{name}}.",
        "greetingReady": "¿Listo para crear, {{name}}?",
        "greetingIdeas": "¿Alguna idea nueva, {{name}}?",
        "greetingMake": "Creemos algo, {{name}}.",
        "greetingFresh": "Un nuevo comienzo, {{name}}.",
        "greetingTakeYourTime": "Sin prisa, {{name}}.",
        "promptLabel": "Descripción de la obra",
        "inventorPlaceholder": "Describe tu universo.",
        "shortcut": "Ctrl + Enter"
      }
    },
    "createExamples": {
      "startHint": "Empieza con un ejemplo",
      "label": "Explorar ejemplos",
      "close": "Cerrar ejemplos",
      "prompt": "Crea una presentación sobre «{{topic}}». {{direction}} Define la audiencia, la decisión que necesita tomar y el mensaje central. Organiza una narrativa coherente de 8–12 diapositivas, con título breve, ideas clave, propuesta visual y notas del presentador en cada una. Usa solo los hechos y materiales que aporte; identifica la información pendiente y las hipótesis ilustrativas sin inventar cifras ni fuentes. Termina con próximos pasos concretos. Si falta contexto esencial, hazme hasta tres preguntas específicas antes de redactar.",
      "categories": {
        "finance": {
          "label": "Finanzas",
          "direction": "Para responsables financieros: analiza los factores de rendimiento, flujo de caja, escenarios y riesgos pertinentes. Indica periodos y métricas; separa resultados históricos, previsiones e hipótesis.",
          "examples": {
            "0": "Resultados financieros trimestrales",
            "1": "Investigación de inversión sectorial",
            "2": "Evaluación de riesgos empresariales",
            "3": "Presupuesto anual",
            "4": "Análisis del flujo de caja"
          }
        },
        "consulting": {
          "label": "Consultoría",
          "direction": "Para la dirección del cliente: delimita el problema, diagnostica causas, compara opciones y prioriza recomendaciones. Incluye hitos, responsables e indicadores; separa hechos e hipótesis.",
          "examples": {
            "0": "Entrada en un nuevo mercado",
            "1": "Diagnóstico del modelo de negocio",
            "2": "Hoja de ruta de transformación digital",
            "3": "Eficiencia organizativa",
            "4": "Revisión de un proyecto de consultoría"
          }
        },
        "sales": {
          "label": "Ventas",
          "direction": "Para clientes potenciales o actuales: parte de sus problemas, presenta usos y valor con pruebas disponibles, responde a objeciones y propone el siguiente paso. No inventes casos ni garantías.",
          "examples": {
            "0": "Propuesta comercial para empresas",
            "1": "Narrativa de demostración de producto",
            "2": "Revisión del éxito del cliente",
            "3": "Comparación competitiva",
            "4": "Formación del equipo de ventas"
          }
        },
        "education": {
          "label": "Educación",
          "direction": "Define los estudiantes o participantes y los objetivos de aprendizaje. Explica progresivamente, añade ejemplos, ejercicios y evaluación de comprensión; adapta el vocabulario al público.",
          "examples": {
            "0": "Una clase que aclara conceptos",
            "1": "Presentación de admisiones",
            "2": "Taller de formación para empleados",
            "3": "Presentación de resultados de aprendizaje",
            "4": "Diseño curricular"
          }
        },
        "healthcare": {
          "label": "Salud",
          "direction": "Define el público sanitario y explica contexto, pruebas fiables, procesos y limitaciones. Usa materiales aprobados y anonimizados, cita fechas y fuentes y no inventes resultados clínicos ni des instrucciones médicas personalizadas.",
          "examples": {
            "0": "Educación sanitaria para pacientes",
            "1": "Presentación de un servicio hospitalario",
            "2": "Explicación de investigación clínica",
            "3": "Recorrido del servicio sanitario",
            "4": "Mejora de la calidad asistencial"
          }
        },
        "fundraising": {
          "label": "Financiación",
          "direction": "Para inversores: conecta problema, solución, mercado, diferenciación, modelo de negocio, tracción, equipo y financiación según el tema. Separa datos reales y proyecciones; no inventes clientes ni tamaños de mercado.",
          "examples": {
            "0": "Presentación para ronda semilla",
            "1": "Historia de crecimiento para Serie A",
            "2": "Modelo de negocio para inversores",
            "3": "Actualización trimestral para inversores",
            "4": "Uso de fondos e hitos"
          }
        },
        "general": {
          "label": "General",
          "direction": "Define público y resultado esperado. Estructura una introducción clara, un análisis y conclusiones accionables. Incluye ejemplos, gráficos, dependencias y preguntas pendientes, con una idea principal por diapositiva.",
          "examples": {
            "0": "Inicio de proyecto",
            "1": "Balance anual",
            "2": "Lanzamiento de producto",
            "3": "Propuesta de evento",
            "4": "Portafolio personal"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "Borrador local · La generación con IA aún no está conectada",
      "createDraft": "Crear borrador local",
      "failed": "No se pudo guardar el borrador. Inténtalo de nuevo.",
      "recentTitle": "Presentaciones recientes",
      "recentLoading": "Cargando presentaciones…",
      "recentFailed": "No se pudieron cargar las presentaciones locales.",
      "retry": "Reintentar",
      "untitled": "Presentación sin título",
      "showMore": "Mostrar más"
    }
  },
  "ja": {
    "dashboard": {
      "newMasterpiece": "新しい作品",
      "deckFormat": {
        "presentationS": "Presentation-S"
      },
      "create": {
        "title": "何を作りますか？",
        "greetingMorning": "おはようございます、{{name}}",
        "greetingAfternoon": "こんにちは、{{name}}",
        "greetingEvening": "こんばんは、{{name}}",
        "greetingGoodToSee": "会えてうれしいです、{{name}}。",
        "greetingWelcomeBack": "おかえりなさい、{{name}}。",
        "greetingReady": "創作を始めましょうか、{{name}}？",
        "greetingIdeas": "新しいアイデアはありますか、{{name}}？",
        "greetingMake": "一緒に作りましょう、{{name}}。",
        "greetingFresh": "新しいスタートですね、{{name}}。",
        "greetingTakeYourTime": "ゆっくりどうぞ、{{name}}。",
        "promptLabel": "作品のプロンプト",
        "inventorPlaceholder": "あなたの世界を説明してください。",
        "shortcut": "Ctrl + Enter"
      }
    },
    "createExamples": {
      "startHint": "例から始める",
      "label": "プロンプトの例を探す",
      "close": "例を閉じる",
      "prompt": "「{{topic}}」についてプレゼンテーションを作成してください。{{direction}} 対象者、必要な意思決定、中心となるメッセージを明確にし、8〜12枚の一貫した構成にしてください。各スライドに簡潔な見出し、要点、図表の提案、発表者ノートを含めてください。提供した事実や資料のみを使い、不足情報と仮定を明記し、数値や出典を捏造しないでください。最後に具体的な次の行動を示してください。必要な背景が不足していれば、作成前に具体的な質問を3つ以内でしてください。",
      "categories": {
        "finance": {
          "label": "金融",
          "direction": "財務・投資の意思決定者向けに、業績要因、キャッシュフロー、シナリオとリスクを整理してください。集計期間や指標を明記し、実績、予測、仮定を区別してください。",
          "examples": {
            "0": "四半期の財務業績レビュー",
            "1": "業界の投資調査",
            "2": "企業リスク評価",
            "3": "年間予算計画",
            "4": "キャッシュフロー分析"
          }
        },
        "consulting": {
          "label": "コンサル",
          "direction": "顧客の経営陣向けに、課題と範囲を定義し、根本原因を分析して選択肢を比較し、提案に優先順位を付けてください。工程、担当役割、成果指標を示してください。",
          "examples": {
            "0": "新市場への参入戦略",
            "1": "事業モデルの診断",
            "2": "デジタル変革ロードマップ",
            "3": "組織効率の改善",
            "4": "コンサルティング案件の振り返り"
          }
        },
        "sales": {
          "label": "営業",
          "direction": "見込み客または既存顧客の課題を起点に、利用場面、価値、提供された根拠を示し、懸念に答えて次の行動を提案してください。顧客事例や効果保証を捏造しないでください。",
          "examples": {
            "0": "法人営業の提案",
            "1": "製品デモのストーリー",
            "2": "カスタマーサクセスの振り返り",
            "3": "競合比較",
            "4": "営業チーム研修"
          }
        },
        "education": {
          "label": "教育・研修",
          "direction": "学習者と学習目標を定め、概念を段階的に説明してください。具体例、演習、理解度確認を含め、対象者に応じた語彙と難易度にしてください。",
          "examples": {
            "0": "概念が伝わる授業",
            "1": "学校の入学説明会",
            "2": "社員研修ワークショップ",
            "3": "学習成果の発表",
            "4": "カリキュラム設計"
          }
        },
        "healthcare": {
          "label": "医療",
          "direction": "対象者を定め、背景、信頼できる根拠、手順と限界を説明してください。承認済みで匿名化された資料を用い、医療情報には日付と出典を示し、臨床結果を捏造せず、個別の診断や治療指示を提供しないでください。",
          "examples": {
            "0": "患者向け健康教育",
            "1": "診療科の紹介",
            "2": "臨床研究の解説",
            "3": "医療サービスの流れ",
            "4": "医療の質の改善"
          }
        },
        "fundraising": {
          "label": "資金調達",
          "direction": "投資家向けに、課題、解決策、市場、差別化、事業モデル、実績、チーム、資金計画をテーマに応じて結び付けてください。実績と予測を区別し、顧客や市場規模を捏造しないでください。",
          "examples": {
            "0": "シードラウンドのピッチ",
            "1": "シリーズAの成長ストーリー",
            "2": "投資家向け事業モデル",
            "3": "投資家への四半期報告",
            "4": "資金使途とマイルストーン"
          }
        },
        "general": {
          "label": "一般",
          "direction": "対象者と目標を定め、明快な導入、構造化した分析、実行可能な結論で構成してください。具体例、図表、前提条件と未解決事項を示し、各ページの主張を一つに絞ってください。",
          "examples": {
            "0": "プロジェクト開始会議",
            "1": "年間レビュー",
            "2": "製品発表",
            "3": "イベント企画",
            "4": "個人ポートフォリオ"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "ローカル下書き · AI 生成は未接続です",
      "createDraft": "ローカル下書きを作成",
      "failed": "下書きを保存できませんでした。もう一度お試しください。",
      "recentTitle": "最近の文書",
      "recentLoading": "文書を読み込み中…",
      "recentFailed": "ローカル文書を読み込めませんでした。",
      "retry": "再試行",
      "untitled": "無題の文書",
      "showMore": "さらに表示"
    }
  },
  "ko": {
    "dashboard": {
      "newMasterpiece": "새 작품",
      "deckFormat": {
        "presentationS": "Presentation-S"
      },
      "create": {
        "title": "무엇을 만드시겠어요?",
        "greetingMorning": "좋은 아침이에요, {{name}}",
        "greetingAfternoon": "좋은 오후예요, {{name}}",
        "greetingEvening": "좋은 저녁이에요, {{name}}",
        "greetingGoodToSee": "만나서 반가워요, {{name}}.",
        "greetingWelcomeBack": "다시 오신 걸 환영해요, {{name}}.",
        "greetingReady": "만들 준비되셨나요, {{name}}?",
        "greetingIdeas": "새로운 아이디어가 있나요, {{name}}?",
        "greetingMake": "함께 만들어 봐요, {{name}}.",
        "greetingFresh": "새롭게 시작해요, {{name}}.",
        "greetingTakeYourTime": "천천히 하세요, {{name}}.",
        "promptLabel": "작품 프롬프트",
        "inventorPlaceholder": "당신의 세계를 설명하세요.",
        "shortcut": "Ctrl + Enter"
      }
    },
    "createExamples": {
      "startHint": "예시로 시작하기",
      "label": "프롬프트 예시 살펴보기",
      "close": "예시 닫기",
      "prompt": "“{{topic}}”에 관한 프레젠테이션을 만들어 주세요. {{direction}} 청중, 필요한 의사결정, 핵심 메시지를 먼저 정하고 8–12장의 일관된 이야기로 구성해 주세요. 각 슬라이드에 짧은 제목, 핵심 내용, 시각 자료 제안, 발표자 노트를 포함해 주세요. 제가 제공한 사실과 자료만 사용하고 누락 정보와 가정을 명시하며 수치나 출처를 만들지 마세요. 구체적인 다음 행동으로 마무리해 주세요. 필수 배경이 부족하면 작성 전에 구체적인 질문을 세 개 이내로 해 주세요.",
      "categories": {
        "finance": {
          "label": "금융",
          "direction": "재무 또는 투자 의사결정자를 위해 성과 요인, 현금 흐름, 시나리오와 위험을 정리해 주세요. 측정 기간과 지표를 명시하고 실적, 전망, 가정을 구분해 주세요.",
          "examples": {
            "0": "분기 재무 성과 리뷰",
            "1": "산업 투자 리서치",
            "2": "기업 위험 평가",
            "3": "연간 예산 계획",
            "4": "현금 흐름 분석"
          }
        },
        "consulting": {
          "label": "컨설팅",
          "direction": "고객 경영진을 위해 문제와 범위를 정의하고 근본 원인을 분석하며 대안을 비교해 권고안의 우선순위를 정해 주세요. 이정표, 책임 역할, 성과 지표를 포함해 주세요.",
          "examples": {
            "0": "신규 시장 진입 전략",
            "1": "사업 모델 진단",
            "2": "디지털 전환 로드맵",
            "3": "조직 효율 개선",
            "4": "컨설팅 프로젝트 회고"
          }
        },
        "sales": {
          "label": "영업",
          "direction": "잠재 고객이나 기존 고객의 문제에서 시작해 활용 사례, 가치와 근거를 보여 주고 우려에 답하며 다음 행동을 제시해 주세요. 고객 사례나 효과 보장을 지어내지 마세요.",
          "examples": {
            "0": "기업 고객 영업 제안",
            "1": "제품 데모 스토리",
            "2": "고객 성공 리뷰",
            "3": "경쟁 제품 비교",
            "4": "영업팀 교육"
          }
        },
        "education": {
          "label": "교육",
          "direction": "학습자와 학습 목표를 정하고 개념을 단계적으로 설명해 주세요. 구체적인 예시, 참여 활동, 이해도 평가를 포함하며 대상에 맞는 용어와 난이도를 사용해 주세요.",
          "examples": {
            "0": "개념을 쉽게 설명하는 수업",
            "1": "학교 입학 설명회",
            "2": "직원 교육 워크숍",
            "3": "학습 성과 발표",
            "4": "교육과정 설계"
          }
        },
        "healthcare": {
          "label": "의료",
          "direction": "적절한 의료 청중을 정하고 배경, 신뢰할 수 있는 근거, 실제 절차와 한계를 설명해 주세요. 승인된 비식별 자료를 사용하고 의학적 주장에는 날짜와 출처를 명시하며 임상 결과를 지어내거나 개인별 진단·치료 지침을 제공하지 마세요.",
          "examples": {
            "0": "환자 건강 교육",
            "1": "병원 진료과 소개",
            "2": "임상 연구 해설",
            "3": "의료 서비스 이용 과정",
            "4": "의료 품질 개선"
          }
        },
        "fundraising": {
          "label": "투자 유치",
          "direction": "투자자를 위해 문제, 해결책, 시장, 차별화, 사업 모델, 실적, 팀과 자금 계획을 주제에 맞게 연결해 주세요. 실제 지표와 전망을 구분하고 고객이나 시장 규모를 지어내지 마세요.",
          "examples": {
            "0": "시드 투자 피치덱",
            "1": "시리즈 A 성장 스토리",
            "2": "투자자용 사업 모델",
            "3": "투자자 분기 업데이트",
            "4": "자금 사용 계획과 이정표"
          }
        },
        "general": {
          "label": "일반",
          "direction": "청중과 원하는 결과를 정하고 명확한 도입, 체계적 분석, 실행 가능한 결론으로 구성해 주세요. 예시, 도표, 의존 조건과 미해결 질문을 제시하고 슬라이드마다 한 가지 핵심에 집중해 주세요.",
          "examples": {
            "0": "프로젝트 착수 회의",
            "1": "연간 업무 리뷰",
            "2": "제품 출시 발표",
            "3": "행사 기획 제안",
            "4": "개인 포트폴리오"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "로컬 초안 · AI 생성은 아직 연결되지 않았습니다",
      "createDraft": "로컬 초안 만들기",
      "failed": "초안을 저장하지 못했습니다. 다시 시도하세요.",
      "recentTitle": "최근 프레젠테이션",
      "recentLoading": "프레젠테이션을 불러오는 중…",
      "recentFailed": "로컬 프레젠테이션을 불러오지 못했습니다.",
      "retry": "다시 시도",
      "untitled": "제목 없는 프레젠테이션",
      "showMore": "더 보기"
    }
  },
  "fr": {
    "dashboard": {
      "newMasterpiece": "Nouvelle création",
      "deckFormat": {
        "presentationS": "Presentation-S"
      },
      "create": {
        "title": "Qu’allez-vous créer ?",
        "greetingMorning": "Bonjour, {{name}}",
        "greetingAfternoon": "Bon après-midi, {{name}}",
        "greetingEvening": "Bonsoir, {{name}}",
        "greetingGoodToSee": "Ravi de vous voir, {{name}}.",
        "greetingWelcomeBack": "Bon retour, {{name}}.",
        "greetingReady": "On se lance, {{name}} ?",
        "greetingIdeas": "De nouvelles idées, {{name}} ?",
        "greetingMake": "Créons quelque chose, {{name}}.",
        "greetingFresh": "Un nouveau départ, {{name}}.",
        "greetingTakeYourTime": "Prenez votre temps, {{name}}.",
        "promptLabel": "Description de la création",
        "inventorPlaceholder": "Décrivez votre univers.",
        "shortcut": "Ctrl + Entrée"
      }
    },
    "createExamples": {
      "startHint": "Partez d’un exemple",
      "label": "Explorer les exemples",
      "close": "Fermer les exemples",
      "prompt": "Crée une présentation sur « {{topic}} ». {{direction}} Définis le public, la décision à prendre et le message central. Construis un récit cohérent de 8 à 12 diapositives, chacune avec un titre bref, les points clés, une proposition visuelle et des notes de présentation. Utilise uniquement les faits et documents fournis ; signale les informations manquantes et les hypothèses sans inventer de chiffres ni de sources. Termine par des prochaines étapes concrètes. Si un contexte essentiel manque, pose-moi au maximum trois questions précises avant de rédiger.",
      "categories": {
        "finance": {
          "label": "Finance",
          "direction": "Pour des décideurs financiers : analyse les facteurs de performance, la trésorerie, les scénarios et les risques pertinents. Précise périodes et indicateurs ; distingue résultats, prévisions et hypothèses.",
          "examples": {
            "0": "Bilan financier trimestriel",
            "1": "Étude sectorielle pour investisseurs",
            "2": "Évaluation des risques d’entreprise",
            "3": "Planification du budget annuel",
            "4": "Analyse de trésorerie"
          }
        },
        "consulting": {
          "label": "Conseil",
          "direction": "Pour la direction du client : définis le problème, analyse les causes, compare les options et hiérarchise les recommandations. Ajoute jalons, responsabilités et indicateurs de réussite.",
          "examples": {
            "0": "Stratégie d’entrée sur un marché",
            "1": "Diagnostic du modèle économique",
            "2": "Feuille de route de transformation numérique",
            "3": "Efficacité organisationnelle",
            "4": "Bilan d’une mission de conseil"
          }
        },
        "sales": {
          "label": "Vente",
          "direction": "Pour des prospects ou clients : pars de leurs problèmes, présente usages, valeur et preuves disponibles, réponds aux objections et propose une prochaine étape. N’invente ni références clients ni garanties.",
          "examples": {
            "0": "Proposition commerciale B2B",
            "1": "Scénario de démonstration produit",
            "2": "Bilan de réussite client",
            "3": "Comparaison concurrentielle",
            "4": "Formation de l’équipe commerciale"
          }
        },
        "education": {
          "label": "Formation",
          "direction": "Définis les apprenants et objectifs pédagogiques. Explique progressivement, ajoute exemples, exercices et vérification des acquis, avec un vocabulaire adapté au public.",
          "examples": {
            "0": "Un cours qui clarifie les concepts",
            "1": "Présentation des admissions",
            "2": "Atelier de formation des salariés",
            "3": "Présentation des acquis",
            "4": "Conception d’un programme pédagogique"
          }
        },
        "healthcare": {
          "label": "Santé",
          "direction": "Définis le public médical et explique contexte, preuves fiables, parcours et limites. Utilise des documents approuvés et anonymisés, date et source les affirmations médicales ; n’invente pas de résultats cliniques et ne donne pas de diagnostic ou traitement personnalisé.",
          "examples": {
            "0": "Éducation des patients à la santé",
            "1": "Présentation d’un service hospitalier",
            "2": "Explication d’une étude clinique",
            "3": "Parcours de soins",
            "4": "Amélioration de la qualité des soins"
          }
        },
        "fundraising": {
          "label": "Levée de fonds",
          "direction": "Pour des investisseurs : relie problème, solution, marché, différenciation, modèle économique, traction, équipe et financement selon le thème. Sépare chiffres réels et projections ; n’invente ni clients ni taille de marché.",
          "examples": {
            "0": "Pitch de levée en amorçage",
            "1": "Récit de croissance pour série A",
            "2": "Modèle économique pour investisseurs",
            "3": "Bilan trimestriel aux investisseurs",
            "4": "Utilisation des fonds et jalons"
          }
        },
        "general": {
          "label": "Général",
          "direction": "Définis public et résultat attendu. Structure une introduction claire, une analyse et une conclusion concrète. Ajoute exemples, graphiques, dépendances et questions ouvertes, avec une idée principale par diapositive.",
          "examples": {
            "0": "Lancement de projet",
            "1": "Bilan annuel",
            "2": "Lancement de produit",
            "3": "Proposition d’événement",
            "4": "Portfolio personnel"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "Brouillon local · La génération par IA n’est pas encore connectée",
      "createDraft": "Créer un brouillon local",
      "failed": "Impossible d’enregistrer le brouillon. Réessayez.",
      "recentTitle": "Présentations récentes",
      "recentLoading": "Chargement des présentations…",
      "recentFailed": "Impossible de charger les présentations locales.",
      "retry": "Réessayer",
      "untitled": "Présentation sans titre",
      "showMore": "Afficher plus"
    }
  },
  "de": {
    "dashboard": {
      "newMasterpiece": "Neues Meisterwerk",
      "deckFormat": {
        "presentationS": "Presentation-S"
      },
      "create": {
        "title": "Was möchtest du erschaffen?",
        "greetingMorning": "Guten Morgen, {{name}}",
        "greetingAfternoon": "Guten Tag, {{name}}",
        "greetingEvening": "Guten Abend, {{name}}",
        "greetingGoodToSee": "Schön, dich zu sehen, {{name}}.",
        "greetingWelcomeBack": "Willkommen zurück, {{name}}.",
        "greetingReady": "Bereit zum Gestalten, {{name}}?",
        "greetingIdeas": "Neue Ideen, {{name}}?",
        "greetingMake": "Lass uns etwas gestalten, {{name}}.",
        "greetingFresh": "Ein neuer Anfang, {{name}}.",
        "greetingTakeYourTime": "Lass dir Zeit, {{name}}.",
        "promptLabel": "Beschreibung des Meisterwerks",
        "inventorPlaceholder": "Beschreibe dein Universum.",
        "shortcut": "Strg + Eingabetaste"
      }
    },
    "createExamples": {
      "startHint": "Mit einem Beispiel starten",
      "label": "Prompt-Beispiele entdecken",
      "close": "Beispiele schließen",
      "prompt": "Erstelle eine Präsentation zum Thema „{{topic}}“. {{direction}} Definiere Zielgruppe, anstehende Entscheidung und Kernbotschaft. Entwickle eine schlüssige Geschichte mit 8–12 Folien, jeweils mit kurzem Titel, Kernaussagen, Visualisierungsvorschlag und Sprechernotizen. Nutze nur meine Fakten und Unterlagen; kennzeichne fehlende Angaben und illustrative Annahmen, statt Zahlen oder Quellen zu erfinden. Schließe mit konkreten nächsten Schritten. Fehlt wichtiger Kontext, stelle mir vor dem Entwurf höchstens drei gezielte Fragen.",
      "categories": {
        "finance": {
          "label": "Finanzen",
          "direction": "Für Finanzentscheider: analysiere relevante Leistungstreiber, Cashflow, Szenarien und Risiken. Benenne Zeitraum und Kennzahlendefinitionen; trenne historische Ergebnisse, Prognosen und Annahmen.",
          "examples": {
            "0": "Finanzieller Quartalsrückblick",
            "1": "Branchenanalyse für Investoren",
            "2": "Bewertung von Unternehmensrisiken",
            "3": "Jährliche Budgetplanung",
            "4": "Cashflow-Analyse"
          }
        },
        "consulting": {
          "label": "Beratung",
          "direction": "Für die Kundenleitung: grenze Problem und Umfang ein, untersuche Ursachen, vergleiche Optionen und priorisiere Empfehlungen. Ergänze Meilensteine, Verantwortlichkeiten und Erfolgskriterien.",
          "examples": {
            "0": "Markteintrittsstrategie",
            "1": "Diagnose des Geschäftsmodells",
            "2": "Roadmap zur digitalen Transformation",
            "3": "Organisatorische Effizienz",
            "4": "Rückblick auf ein Beratungsprojekt"
          }
        },
        "sales": {
          "label": "Vertrieb",
          "direction": "Für Interessenten oder Kunden: beginne mit ihren Problemen, zeige Anwendungsfälle, Nutzen und vorhandene Belege, behandle Einwände und schlage den nächsten Schritt vor. Erfinde keine Referenzen oder Erfolgsgarantien.",
          "examples": {
            "0": "Vertriebsangebot für Unternehmen",
            "1": "Produktdemo als Geschichte",
            "2": "Kundenerfolgsrückblick",
            "3": "Wettbewerbsvergleich",
            "4": "Schulung des Vertriebsteams"
          }
        },
        "education": {
          "label": "Bildung",
          "direction": "Definiere Lernende und Lernziele. Erkläre schrittweise, ergänze Beispiele, Übungen und Verständnisprüfungen und passe Sprache und Tiefe der Zielgruppe an.",
          "examples": {
            "0": "Ein Kurs, der Konzepte erklärt",
            "1": "Vorstellung der Schulaufnahme",
            "2": "Mitarbeiterschulung",
            "3": "Präsentation von Lernergebnissen",
            "4": "Lehrplangestaltung"
          }
        },
        "healthcare": {
          "label": "Gesundheit",
          "direction": "Definiere die medizinische Zielgruppe und erläutere Hintergrund, verlässliche Belege, Abläufe und Grenzen. Nutze freigegebene anonymisierte Unterlagen, datiere und belege medizinische Aussagen; erfinde keine klinischen Ergebnisse und gib keine individuelle Diagnose oder Therapieanweisung.",
          "examples": {
            "0": "Gesundheitsbildung für Patienten",
            "1": "Vorstellung einer Klinikabteilung",
            "2": "Erläuterung klinischer Forschung",
            "3": "Ablauf der Gesundheitsversorgung",
            "4": "Verbesserung der Versorgungsqualität"
          }
        },
        "fundraising": {
          "label": "Finanzierung",
          "direction": "Für Investoren: verbinde je nach Thema Problem, Lösung, Markt, Differenzierung, Geschäftsmodell, Traktion, Team und Finanzierungsplan. Trenne Ist-Zahlen und Prognosen; erfinde weder Kunden noch Marktgrößen.",
          "examples": {
            "0": "Pitch für die Seed-Runde",
            "1": "Wachstumsgeschichte für Serie A",
            "2": "Geschäftsmodell für Investoren",
            "3": "Quartalsupdate für Investoren",
            "4": "Mittelverwendung und Meilensteine"
          }
        },
        "general": {
          "label": "Allgemein",
          "direction": "Definiere Zielgruppe und gewünschtes Ergebnis. Gliedere in einen klaren Einstieg, strukturierte Analyse und umsetzbare Schlussfolgerungen. Ergänze Beispiele, Grafiken, Abhängigkeiten und offene Fragen; jede Folie hat eine Kernidee.",
          "examples": {
            "0": "Projektauftakt",
            "1": "Jahresrückblick",
            "2": "Produkteinführung",
            "3": "Veranstaltungskonzept",
            "4": "Persönliches Portfolio"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "Lokaler Entwurf · KI-Generierung ist noch nicht verbunden",
      "createDraft": "Lokalen Entwurf erstellen",
      "failed": "Der Entwurf konnte nicht gespeichert werden. Bitte erneut versuchen.",
      "recentTitle": "Letzte Präsentationen",
      "recentLoading": "Präsentationen werden geladen…",
      "recentFailed": "Lokale Präsentationen konnten nicht geladen werden.",
      "retry": "Erneut versuchen",
      "untitled": "Unbenannte Präsentation",
      "showMore": "Mehr anzeigen"
    }
  },
  "pt-BR": {
    "dashboard": {
      "newMasterpiece": "Nova obra",
      "deckFormat": {
        "presentationS": "Presentation-S"
      },
      "create": {
        "title": "O que você vai criar?",
        "greetingMorning": "Bom dia, {{name}}",
        "greetingAfternoon": "Boa tarde, {{name}}",
        "greetingEvening": "Boa noite, {{name}}",
        "greetingGoodToSee": "Bom ver você, {{name}}.",
        "greetingWelcomeBack": "Que bom ter você de volta, {{name}}.",
        "greetingReady": "Vamos criar, {{name}}?",
        "greetingIdeas": "Alguma ideia nova, {{name}}?",
        "greetingMake": "Vamos fazer algo, {{name}}.",
        "greetingFresh": "Um novo começo, {{name}}.",
        "greetingTakeYourTime": "Sem pressa, {{name}}.",
        "promptLabel": "Descrição da obra",
        "inventorPlaceholder": "Descreva seu universo.",
        "shortcut": "Ctrl + Enter"
      }
    },
    "createExamples": {
      "startHint": "Comece com um exemplo",
      "label": "Explorar exemplos",
      "close": "Fechar exemplos",
      "prompt": "Crie uma apresentação sobre “{{topic}}”. {{direction}} Defina o público, a decisão necessária e a mensagem central. Organize uma narrativa coerente de 8–12 slides, cada um com título curto, pontos principais, sugestão visual e notas do apresentador. Use apenas os fatos e materiais que eu fornecer; identifique informações ausentes e hipóteses ilustrativas, sem inventar números ou fontes. Termine com próximos passos concretos. Se faltar contexto essencial, faça até três perguntas específicas antes de redigir.",
      "categories": {
        "finance": {
          "label": "Finanças",
          "direction": "Para decisores financeiros: analise fatores de desempenho, fluxo de caixa, cenários e riscos relevantes. Informe períodos e definições das métricas; separe resultados históricos, projeções e hipóteses.",
          "examples": {
            "0": "Revisão financeira trimestral",
            "1": "Pesquisa setorial para investimentos",
            "2": "Avaliação de riscos empresariais",
            "3": "Planejamento do orçamento anual",
            "4": "Análise de fluxo de caixa"
          }
        },
        "consulting": {
          "label": "Consultoria",
          "direction": "Para a liderança do cliente: defina problema e escopo, diagnostique causas, compare opções e priorize recomendações. Inclua marcos, responsáveis e indicadores de sucesso.",
          "examples": {
            "0": "Estratégia de entrada em mercado",
            "1": "Diagnóstico do modelo de negócio",
            "2": "Roteiro de transformação digital",
            "3": "Eficiência organizacional",
            "4": "Revisão de projeto de consultoria"
          }
        },
        "sales": {
          "label": "Vendas",
          "direction": "Para clientes potenciais ou atuais: comece pelos problemas, mostre casos de uso, valor e evidências disponíveis, responda a objeções e proponha o próximo passo. Não invente casos de clientes nem garantias.",
          "examples": {
            "0": "Proposta comercial para empresas",
            "1": "Narrativa de demonstração do produto",
            "2": "Revisão de sucesso do cliente",
            "3": "Comparação de concorrentes",
            "4": "Treinamento da equipe de vendas"
          }
        },
        "education": {
          "label": "Educação",
          "direction": "Defina os alunos e os objetivos de aprendizagem. Explique progressivamente, inclua exemplos, atividades e verificação de compreensão, adaptando linguagem e profundidade ao público.",
          "examples": {
            "0": "Uma aula que esclarece conceitos",
            "1": "Apresentação de matrículas",
            "2": "Workshop de treinamento de funcionários",
            "3": "Apresentação dos resultados de aprendizagem",
            "4": "Desenho curricular"
          }
        },
        "healthcare": {
          "label": "Saúde",
          "direction": "Defina o público da área de saúde e explique contexto, evidências confiáveis, processos e limitações. Use materiais aprovados e anonimizados, indique datas e fontes de afirmações médicas; não invente resultados clínicos nem forneça diagnóstico ou tratamento individualizado.",
          "examples": {
            "0": "Educação em saúde para pacientes",
            "1": "Apresentação de departamento hospitalar",
            "2": "Explicação de pesquisa clínica",
            "3": "Jornada do serviço de saúde",
            "4": "Melhoria da qualidade assistencial"
          }
        },
        "fundraising": {
          "label": "Captação",
          "direction": "Para investidores: conecte problema, solução, mercado, diferenciação, modelo de negócio, tração, equipe e plano de financiamento conforme o tema. Separe métricas reais de projeções; não invente clientes nem tamanho de mercado.",
          "examples": {
            "0": "Pitch para rodada semente",
            "1": "História de crescimento para Série A",
            "2": "Modelo de negócio para investidores",
            "3": "Atualização trimestral para investidores",
            "4": "Uso dos recursos e marcos"
          }
        },
        "general": {
          "label": "Geral",
          "direction": "Defina público e resultado esperado. Organize introdução clara, análise estruturada e conclusões práticas. Inclua exemplos, gráficos, dependências e questões em aberto, com uma ideia principal por slide.",
          "examples": {
            "0": "Reunião de início de projeto",
            "1": "Balanço anual",
            "2": "Lançamento de produto",
            "3": "Proposta de evento",
            "4": "Portfólio pessoal"
          }
        }
      }
    },
    "openSourceCreate": {
      "localDraftNotice": "Rascunho local · A geração por IA ainda não está conectada",
      "createDraft": "Criar rascunho local",
      "failed": "Não foi possível salvar o rascunho. Tente novamente.",
      "recentTitle": "Apresentações recentes",
      "recentLoading": "Carregando apresentações…",
      "recentFailed": "Não foi possível carregar as apresentações locais.",
      "retry": "Tentar novamente",
      "untitled": "Apresentação sem título",
      "showMore": "Mostrar mais"
    }
  }
} as const;
