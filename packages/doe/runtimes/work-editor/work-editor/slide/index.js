// Origin: public/yrkie-doe/work-editor/work-editor.js:60


export function slide(id, blocks) {
    return {
      id,
      size: { width: 960, height: 540, unit: "pt" },
      editor: true,
      layout: {
        preset: "flow",
        overflowPolicy: "reject-edit",
        autoRepair: true,
        maxRepairPasses: 4,
        fallback: "needs-continuation",
        allowEmergency8Pt: false,
        spacing: {
          pagePadding: "36pt",
          sectionGap: "18pt",
          groupGap: "18pt",
          internalGap: "12pt",
        },
      },
      blocks,
    };
  }
