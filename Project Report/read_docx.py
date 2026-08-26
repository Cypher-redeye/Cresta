import sys
import zipfile
import xml.etree.ElementTree as ET

def extract_text_from_docx(docx_path):
    try:
        document = zipfile.ZipFile(docx_path)
        xml_content = document.read('word/document.xml')
        document.close()
        tree = ET.XML(xml_content)
        
        WORD_NAMESPACE = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        PARA = WORD_NAMESPACE + 'p'
        TEXT = WORD_NAMESPACE + 't'
        
        paragraphs = []
        for paragraph in tree.iter(PARA):
            texts = [node.text
                     for node in paragraph.iter(TEXT)
                     if node.text]
            if texts:
                paragraphs.append(''.join(texts))
        return '\n'.join(paragraphs)
    except Exception as e:
        return str(e)

if __name__ == "__main__":
    path = r"c:\Users\om231\OneDrive\Desktop\Projects\Cresta\Project Report\Cresta_Report.docx"
    text = extract_text_from_docx(path)
    with open(r"c:\Users\om231\OneDrive\Desktop\Projects\Cresta\Project Report\Cresta_Report.txt", "w", encoding="utf-8") as f:
        f.write(text)
    print("Extracted text successfully, lines:", len(text.split('\n')))
