#!/usr/bin/env python3
"""
advanced_ocr.py

Script Python per OCR avanzato con Docling e PaddleOCR-VL
Supporta entrambi i motori e restituisce risultati in JSON

Dependencies:
  pip install docling paddleocr pillow pandas openpyxl

Author: SmartDocs AI
Version: 1.0.0
"""

import sys
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional
import time

# Flag per verificare disponibilità librerie
DOCLING_AVAILABLE = False
PADDLEOCR_AVAILABLE = False
MARKER_AVAILABLE = False  # ✅ Added Marker

try:
    from docling.document_converter import DocumentConverter, PdfFormatOption
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import (
        PdfPipelineOptions,
        TesseractCliOcrOptions,
        EasyOcrOptions,
        TableFormerMode
    )
    from docling_core.types.doc import ImageRefMode, PictureItem, TableItem
    DOCLING_AVAILABLE = True
except ImportError:
    pass

try:
    from paddleocr import PaddleOCRVL
    PADDLEOCR_AVAILABLE = True
except ImportError:
    pass

try:
    from marker.convert import convert_single_pdf
    from marker.models import load_all_models
    MARKER_AVAILABLE = True
except ImportError:
    pass


class AdvancedOCRProcessor:
    """Processore OCR unificato per Docling e PaddleOCR-VL"""
    
    def __init__(self):
        self.docling_available = DOCLING_AVAILABLE
        self.paddleocr_available = PADDLEOCR_AVAILABLE
        self.marker_available = MARKER_AVAILABLE  # ✅ Added Marker
    
    def process_with_docling(
        self,
        input_path: str,
        enable_ocr: bool = False,  # 🔥 DEFAULT FALSE - OCR only if explicitly requested
        enable_tables: bool = True,
        preserve_images: bool = False,
        image_resolution: float = 2.0,
        full_page_ocr: bool = False,
        ocr_lang: Optional[List[str]] = None,
        output_format: str = 'markdown',
        enable_chunking: bool = True  # Enable Docling hybrid chunking
    ) -> Dict[str, Any]:
        """Processa documento con Docling
        
        Note: OCR is disabled by default. Most PDFs are already text-based.
              Enable OCR only for scanned documents.
        """
        
        if not self.docling_available:
            raise RuntimeError("Docling non disponibile. Installa con: pip install docling")
        
        start_time = time.time()
        
        # Configura pipeline con opzioni avanzate per qualità ottimale
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = enable_ocr
        pipeline_options.do_table_structure = enable_tables
        
        # ✅ Opzioni avanzate per tabelle ad alta qualità
        if enable_tables:
            pipeline_options.table_structure_options.do_cell_matching = True
            pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE  # Modalità accurata
        
        # ✅ Opzioni OCR avanzate
        if enable_ocr:
            if full_page_ocr:
                ocr_options = TesseractCliOcrOptions(force_full_page_ocr=True)
                if ocr_lang:
                    ocr_options.lang = ocr_lang
                pipeline_options.ocr_options = ocr_options
            else:
                ocr_options = EasyOcrOptions()
                if ocr_lang:
                    ocr_options.lang = ocr_lang
                pipeline_options.ocr_options = ocr_options
        
        # ✅ Impostazioni immagini per migliore struttura documento
        if preserve_images:
            pipeline_options.images_scale = image_resolution
            pipeline_options.generate_page_images = True
            pipeline_options.generate_picture_images = True
        
        # Crea converter
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        
        # Converti documento
        result = converter.convert(input_path)
        doc = result.document
        
        # Estrai contenuto
        text = doc.export_to_markdown(strict_text=True) if output_format == 'text' else ''
        markdown = doc.export_to_markdown() if output_format in ['markdown', 'json'] else ''
        html = None  # doc.export_to_html() if output_format == 'html' else None
        json_data = doc.export_to_dict() if output_format == 'json' else None
        
        # Estrai tabelle
        tables = []
        for idx, table in enumerate(doc.tables):
            try:
                df = table.export_to_dataframe()
                tables.append({
                    'index': idx,
                    'rows': len(df),
                    'columns': len(df.columns),
                    'content': df.values.tolist(),
                    'csv': df.to_csv(),
                    'html': table.export_to_html(doc=doc)
                })
            except Exception as e:
                print(f"Warning: Could not export table {idx}: {e}", file=sys.stderr)
        
        # Estrai immagini
        images = []
        if preserve_images:
            picture_counter = 0
            for element, _level in doc.iterate_items():
                if isinstance(element, PictureItem):
                    picture_counter += 1
                    try:
                        img = element.get_image(doc)
                        images.append({
                            'index': picture_counter,
                            'type': 'picture',
                            'width': img.width,
                            'height': img.height
                        })
                    except Exception as e:
                        print(f"Warning: Could not extract image {picture_counter}: {e}", file=sys.stderr)
        
        processing_time = time.time() - start_time
        
        # Extract Docling chunks if enabled
        docling_chunks = []
        if enable_chunking:
            try:
                from docling.chunking import HybridChunker
                
                chunker = HybridChunker(
                    tokenizer='bert-base-uncased',
                    max_tokens=512,
                    include_section_info=True
                )
                
                chunk_index = 0
                for chunk in chunker.chunk(doc):
                    docling_chunks.append({
                        'text': chunk.text,
                        'index': chunk_index,
                        'section': getattr(chunk.meta, 'section_name', None),
                        'level': getattr(chunk.meta, 'section_level', 0),
                        'type': getattr(chunk.meta, 'element_type', 'text'),
                        'metadata': {
                            'start_char': getattr(chunk.meta, 'start_char', 0),
                            'end_char': getattr(chunk.meta, 'end_char', len(chunk.text)),
                            'parent_section': getattr(chunk.meta, 'parent_section', None),
                            'tokens': getattr(chunk.meta, 'token_count', 0)
                        }
                    })
                    chunk_index += 1
            except Exception as e:
                print(f"Warning: Docling chunking failed: {e}", file=sys.stderr)
        
        return {
            'success': True,
            'engine': 'docling',
            'text': text,
            'markdown': markdown,
            'html': html,
            'json': json_data,
            'metadata': {
                'page_count': len(doc.pages),
                'language': 'unknown',  # Docling non rileva lingua automaticamente
            },
            'tables': tables,
            'images': images,
            'processing_time': processing_time,
            'docling_chunks': docling_chunks  # Chunks from Docling hybrid chunking
        }
    
    def process_with_paddleocr(
        self,
        input_path: str,
        enable_tables: bool = True,
        enable_formulas: bool = False,
        enable_charts: bool = False,
        preserve_images: bool = False,
        output_format: str = 'markdown'
    ) -> Dict[str, Any]:
        """Processa documento con PaddleOCR-VL"""
        
        if not self.paddleocr_available:
            raise RuntimeError("PaddleOCR-VL non disponibile. Installa con: pip install paddleocr")
        
        start_time = time.time()
        
        # Inizializza PaddleOCR-VL
        pipeline = PaddleOCRVL(
            use_layout_detection=enable_tables,
            use_chart_recognition=enable_charts
        )
        
        # Processa documento
        output = pipeline.predict(input_path)
        
        # Aggrega risultati
        markdown_list = []
        tables_list = []
        formulas_list = []
        charts_list = []
        full_text = []
        
        for page_idx, res in enumerate(output):
            # Markdown
            md_info = res.markdown
            markdown_list.append(md_info.get('markdown_text', ''))
            
            # JSON per structured data
            json_data = res.json
            
            # Testo
            full_text.append(md_info.get('markdown_text', ''))
            
            # TODO: Estrai tabelle, formule, charts da json_data
            # Questa parte dipende dalla struttura esatta del JSON di PaddleOCR-VL
        
        # Concatena markdown
        markdown_text = '\n\n'.join(markdown_list)
        text = markdown_text if output_format == 'text' else markdown_text
        
        processing_time = time.time() - start_time
        
        return {
            'success': True,
            'engine': 'paddleocr-vl',
            'text': text,
            'markdown': markdown_text,
            'html': None,  # PaddleOCR può generare HTML ma richiede processing extra
            'json': None,
            'metadata': {
                'page_count': len(output),
                'language': 'multi',  # PaddleOCR supporta 109 lingue
                'confidence': 0.95  # Placeholder
            },
            'tables': tables_list,
            'formulas': formulas_list,
            'charts': charts_list,
            'images': [],
            'processing_time': processing_time
        }
    
    def process_with_marker(
        self,
        input_path: str,
        enable_tables: bool = True,
        preserve_images: bool = True,
        output_format: str = 'markdown'
    ) -> Dict[str, Any]:
        """Processa documento con Marker
        
        Marker è ottimizzato per velocità e accuratezza, con supporto
        per tabelle multi-pagina, formule LaTeX, e rimozione header/footer.
        """
        
        if not self.marker_available:
            raise RuntimeError("Marker non disponibile. Installa con: pip install marker-pdf")
        
        start_time = time.time()
        
        try:
            # Carica modelli Marker (singleton, cached after first load)
            print("Loading Marker models (first run may take 5-10 min)...", file=sys.stderr)
            model_lst = load_all_models()
            print(f"Models loaded! Processing PDF: {input_path}", file=sys.stderr)
            
            # Converti in path assoluto per evitare problemi con pdfium
            import os
            abs_path = os.path.abspath(input_path)
            print(f"Absolute path: {abs_path}", file=sys.stderr)
            
            if not os.path.exists(abs_path):
                raise FileNotFoundError(f"PDF file not found: {abs_path}")
            
            # Converti PDF usando Marker 0.2.6 API
            # convert_single_pdf ritorna (full_text, images_dict, out_meta)
            result = convert_single_pdf(
                fname=abs_path,
                model_lst=model_lst,
                max_pages=None,  # Process all pages
                langs=None,      # Auto-detect languages
            )
            
            # Nella versione 0.2.6, result è una tupla (full_text, images, out_meta)
            if isinstance(result, tuple):
                full_text = result[0]
                out_meta = result[2] if len(result) > 2 else {}
            else:
                # Fallback: prova a estrarre come stringa
                full_text = str(result)
                out_meta = {}
            
            print("PDF conversion complete!", file=sys.stderr)
            
            # Il full_text è già markdown
            markdown = full_text
            
            # Estrai metadati
            page_count = out_meta.get('page_count', 0) if out_meta else 0
            
            processing_time = time.time() - start_time
            
            return {
                'success': True,
                'engine': 'marker',
                'text': full_text,
                'markdown': markdown,
                'html': None,
                'json': None,
                'metadata': {
                    'page_count': page_count,
                    'language': 'unknown',
                },
                'tables': [],  # Marker integra tabelle nel markdown
                'images': [],  # Marker integra immagini nel markdown
                'processing_time': processing_time
            }
            
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print(f"Marker error details: {error_trace}", file=sys.stderr)
            raise RuntimeError(f"Marker processing failed: {str(e)}")

    def check_engines(self) -> Dict[str, bool]:
        """Verifica disponibilità motori"""
        return {
            'docling': self.docling_available,
            'paddleocr': self.paddleocr_available,
            'marker': self.marker_available  # ✅ Added Marker
        }


def main():
    parser = argparse.ArgumentParser(description='Advanced OCR with Docling, PaddleOCR-VL and Marker')
    
    parser.add_argument('--engine', choices=['docling', 'paddleocr', 'marker'], required=False,
                       help='OCR engine to use')
    parser.add_argument('--input', type=str, help='Input file path')
    parser.add_argument('--output-format', choices=['text', 'markdown', 'html', 'json'],
                       default='markdown', help='Output format')
    parser.add_argument('--enable-ocr', action='store_true', help='Enable OCR (Docling)')
    parser.add_argument('--enable-tables', action='store_true', help='Enable table extraction')
    parser.add_argument('--enable-formulas', action='store_true', help='Enable formula recognition (PaddleOCR)')
    parser.add_argument('--enable-charts', action='store_true', help='Enable chart recognition (PaddleOCR)')
    parser.add_argument('--preserve-images', action='store_true', help='Preserve and extract images')
    parser.add_argument('--image-resolution', type=float, default=2.0,
                       help='Image resolution scale (1=72 DPI, 2=144 DPI)')
    parser.add_argument('--full-page-ocr', action='store_true', help='Force full-page OCR (Docling)')
    parser.add_argument('--ocr-lang', type=str, help='OCR languages (comma-separated)')
    parser.add_argument('--check-engines', action='store_true', help='Check engine availability')
    
    args = parser.parse_args()
    
    processor = AdvancedOCRProcessor()
    
    # Check engines
    if args.check_engines:
        result = processor.check_engines()
        print(json.dumps(result))
        return
    
    # Validate input
    if not args.input or not args.engine:
        print(json.dumps({
            'success': False,
            'error': 'Missing required arguments: --engine and --input'
        }))
        sys.exit(1)
    
    if not Path(args.input).exists():
        print(json.dumps({
            'success': False,
            'error': f'Input file not found: {args.input}'
        }))
        sys.exit(1)
    
    try:
        # Parse OCR languages
        ocr_lang = args.ocr_lang.split(',') if args.ocr_lang else None
        
        # Process with selected engine
        if args.engine == 'docling':
            result = processor.process_with_docling(
                input_path=args.input,
                enable_ocr=args.enable_ocr,
                enable_tables=args.enable_tables,
                preserve_images=args.preserve_images,
                image_resolution=args.image_resolution,
                full_page_ocr=args.full_page_ocr,
                ocr_lang=ocr_lang,
                output_format=args.output_format
            )
        elif args.engine == 'marker':
            result = processor.process_with_marker(
                input_path=args.input,
                enable_tables=args.enable_tables,
                preserve_images=args.preserve_images,
                output_format=args.output_format
            )
        else:  # paddleocr
            result = processor.process_with_paddleocr(
                input_path=args.input,
                enable_tables=args.enable_tables,
                enable_formulas=args.enable_formulas,
                enable_charts=args.enable_charts,
                preserve_images=args.preserve_images,
                output_format=args.output_format
            )
        
        # Output JSON
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': str(e),
            'traceback': str(e.__traceback__)
        }))
        sys.exit(1)


if __name__ == '__main__':
    main()
