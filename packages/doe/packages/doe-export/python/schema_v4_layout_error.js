"use strict";

const CODE = "doe_export_layout_overflow";

class SchemaLayoutOverflowError extends Error {
  constructor(page) {
    super("The slide content exceeds the available space.");
    this.code = CODE;
    this.page = page;
  }
}

// This function is serialized by page.evaluate; keep it closure-free.
async function mountSchemaSlide({ slide, index, total, theme, flowLayout, logo }) {
  try {
    const mounted = await window.YrkieDoeExportRuntime.renderSlide(slide, index, total, theme, flowLayout, logo);
    return { slide: mounted.result.slide, elementId: mounted.element?.id || "" };
  } catch (error) {
    if (error?.code === "doe_export_layout_overflow") {
      return { success: false, error: { code: "doe_export_layout_overflow", page: index + 1 } };
    }
    throw error;
  }
}

function throwIfLayoutFailure(result, total) {
  if (result?.success === false && result.error?.code === CODE
    && Number.isInteger(result.error.page) && result.error.page >= 1 && result.error.page <= total) {
    throw new SchemaLayoutOverflowError(result.error.page);
  }
}

function layoutFailureEnvelope(error) {
  return error instanceof SchemaLayoutOverflowError
    ? { success: false, error: { code: CODE, page: error.page } } : null;
}

module.exports = { mountSchemaSlide, throwIfLayoutFailure, layoutFailureEnvelope };
