from docling.document_converter import (
    DocumentConverter,
    PdfFormatOption,
)
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    AcceleratorOptions,
)


def create_pdf_converter():
    """Create a lightweight Docling PDF converter."""

    pipeline_options = PdfPipelineOptions()

    # Disable unnecessary processing for text-based PDFs
    pipeline_options.do_ocr = False
    pipeline_options.do_table_structure = False
    pipeline_options.force_backend_text = True

    # Disable image generation
    pipeline_options.generate_page_images = False
    pipeline_options.generate_picture_images = False

    # CPU configuration
    pipeline_options.accelerator_options = AcceleratorOptions(
        num_threads=2,
        device="cpu",
    )

    return DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options
            )
        }
    )


def pdf_to_markdown(converter, pdf_path):
    """Convert a PDF file into Markdown."""

    result = converter.convert(str(pdf_path))

    return result.document.export_to_markdown()