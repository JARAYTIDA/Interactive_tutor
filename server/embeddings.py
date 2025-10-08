import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

# 1. Load environment variables
load_dotenv()
openai_api_key = os.getenv("OPENAI_API_KEY")

# 2. Load the PDF
pdf_path = "/home/aditya/Code/Vs_Code/Rooman/Interactive_tutor/server/CCNA-200-301.pdf"
loader = PyPDFLoader(pdf_path)
documents = loader.load()

# 3. Split text into smaller chunks
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=150,
)
docs = text_splitter.split_documents(documents)

# 4. Create embeddings using OpenAI
embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)

# 5. Store embeddings in a FAISS vector store
vectorstore = FAISS.from_documents(docs, embeddings)

# 6. Save the FAISS index locally
save_path = "/home/aditya/Code/Vs_Code/Rooman/Interactive_tutor/server/vectorstore_index"
vectorstore.save_local(save_path)
print(f"✅ Embeddings created and saved at '{save_path}'")