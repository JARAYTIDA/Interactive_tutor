from flask import Flask, request, Response, jsonify
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
import os
import re
import json
from murf import Murf
from langchain_openai import ChatOpenAI
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS

fixed_plan = []

os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

voice_api = os.getenv("VOICE_API")
openai_api_key = os.getenv("OPENAI_API_KEY")

llm = ChatOpenAI(
    model_name="gpt-3.5-turbo",  # or "gpt-3.5-turbo"
    temperature=0,
    streaming=True 
)

def parse_learning_plan(text):
    plan = []
    current_module = None
    current_submodule = None

    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue

        # Match Module
        module_match = re.match(r'Module \d+: (.+)', line)
        if module_match:
            current_module = {"module": module_match.group(1), "submodules": []}
            plan.append(current_module)
            current_submodule = None
            continue

        # Match Submodule
        submodule_match = re.match(r'Submodule \d+\.\d+: (.+)', line)
        if submodule_match:
            current_submodule = {"submodule": submodule_match.group(1), "units": []}
            if current_module:
                current_module["submodules"].append(current_submodule)
            continue

        # Match Unit
        unit_match = re.match(r'Unit \d+\.\d+\.\d+: (.+)', line)
        if unit_match:
            if current_submodule:
                current_submodule["units"].append(unit_match.group(1))
            continue

    return plan

def generate_structure(topic):
    try:
        if not topic:
            return jsonify({"error": "Missing 'topic' field"}), 400

        # Define prompt for structured study plan
        prompt_template = ChatPromptTemplate.from_messages([
            ("system", 
             "You are an expert AI tutor. You need to generate structured detailed plan. You need to generate very explained plan that covers the topic in depth and all aspects of it, try to include high volumen of moduels , submoduels and units so this plan would be enough to learn everything about the topic, in the given formate that user has requested, "
             "dividing it into modules, submodules, and units. The structure should be hierarchical and "
             "detailed, long, and advanced course hirarcy for a student. This plan should cover all essential topics and concepts related to the subject. That must be an expert level course plan. "),
            ("user", 
             "Create a structured learning plan for {topic}. "
             "Use this format:\n\n"
             "Module 1: <name>\n"
             "  Submodule 1.1: <name>\n"
             "    Unit 1.1.1: <name>\n"
             "    Unit 1.1.2: <name>\n"
             "  Submodule 1.2: <name>\n"
             "Module 2: <name>\n"
             "... and so on.")
        ])

        prompt = prompt_template.format_messages(topic=topic)
        response = llm.invoke(prompt)

        print("Raw LLM Response+++++++++++++++++++++++++++++++++++++++++++++++")  # Debugging line to check raw response
        print(response.content)  # Debugging line to check raw response
        print("End of Raw LLM Response+++++++++++++++++++++++++++++++++++++++")  # Debugging line to

        structured_plan = parse_learning_plan(response.content)
        print("End of Raw LLM Response======================================")  # Debugging line to
        print(structured_plan)  # Debugging line to check the structured plan
        print("End of Raw LLM Response======================================")  # Debugging line to


        return structured_plan

    except Exception as e:
        print(f"Error: {e}")  # Debugging line to check for errors
        return []
    
def split_text_into_chunks(text, max_len=3000):
    """Split text into chunks up to max_len, breaking at sentence boundaries."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        # If adding this sentence would exceed limit, start a new chunk
        if len(current_chunk) + len(sentence) + 1 > max_len:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = sentence
        else:
            current_chunk += " " + sentence

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    return chunks

def generate_content():
    data = request.get_json()
    topic = data.get('topic', "Python Programming")
    try:
        def generate():
            fixed_plan = generate_structure(topic)
            for module in fixed_plan:
                # yield f"\n=== Module: {module['module']} ===\n"
                for submodule in module['submodules']:
                    # yield f"\n-- Submodule: {submodule['submodule']} --\n"
                    for unit in submodule['units']:
                        # Prepare unit-specific prompt
                        embeddings = OpenAIEmbeddings(openai_api_key=openai_api_key)
                        retriever = FAISS.load_local("/home/aditya/Code/Vs_Code/Rooman/Interactive_tutor/server/vectorstore_index", embeddings, 
                        allow_dangerous_deserialization=True)
                        results = retriever.similarity_search(unit, k=5)
                        prompt_unit = ChatPromptTemplate.from_messages([
                            ("system", 
                             "You are an Expert Tutor That explains a unit that is given to you thoroughly and in a very detailed and advanced level with examples, if there is a code example then provide a one on real implementation, if not give an analogy to make student understand better., so that The student will have knowledge about it completely till expert level. Its you responsibility to give each and every information about the topic that you can so that student does not miss out. Remember you are an excellent tutor. Most importantly generate content so that its easliy readable like markdown. And remember to use Examples Analogies and real world implementations to make student understand better. If there is possible to give a code exmaple then give a real world code . And For low level try to give code exampls inn low level implementation e.g. for computer networks you can use C, C++, Scapy (python) etc."),
                            ("assistant", "Here are some reference documents that might help you:"),
                            ("assistant", "\n".join([doc.page_content for doc in results])),
                            ("user", "Explain the following unit in depth and detailed way: {unit}")
                            ])
                        prompt_unit_msg = prompt_unit.format_messages(unit=unit)

                        unit_text = ""
                        for chunk in llm.stream(prompt_unit_msg):
                            if chunk.content:
                                unit_text += chunk.content
                                yield json.dumps({"type": "text", "content": chunk.content}) + "\n"


                        prompt_unit_for_audio = ChatPromptTemplate.from_messages([
                            ("system", 
                             "You are an Expert Tutor That created a explanation for voice agent for the content that is given to you. Please create a short and concise explanation that covers the topic and one can understand it when the voice angent speaks the same content that generated here. Make sure the content is easy to understand when spoken aloud. Use simple language and short sentences. The explanation should be engaging and informative, suitable for an audio format. Avoid complex terminology and ensure clarity for listeners. This must be a complete paragraph only nothing else"),                            
                             ("user", "Create an audio-friendly explanation for the following explanation : {unit_text}")
                        ])

                        prompt_unit_msg_for_audio = prompt_unit_for_audio.format_messages(unit_text=unit_text)    

                        output_for_voice_agent = llm.invoke(prompt_unit_msg_for_audio)
                        audio_content = output_for_voice_agent.content

                        if unit_text.strip():
                            try:
                                chunks = split_text_into_chunks(audio_content, max_len=3000)
                                for chunk in chunks:
                                    client = Murf(api_key="ap2_8df300ac-f7de-4e03-8956-5786657c1465")
                                    response = client.text_to_speech.generate(
                                        text=chunk,
                                        voice_id="en-UK-hazel"
                                    )
                                    yield json.dumps({
                                        "type": "audio",
                                        "unit": unit,
                                        "audio_url": response.audio_file
                                    }) + "\n"
                            except Exception as tts_error:
                                yield json.dumps({"type": "error", "content": f"TTS failed for {unit}: {str(tts_error)}"}) + "\n"

                        yield json.dumps({"type": "unit_end", "content": f"Completed {unit}"}) + "\n"


                        yield "\n"

        return Response(generate(), mimetype='text/plain')

    except Exception as e:
        return jsonify({"error": str(e)}), 500

def tts():
    client = Murf(api_key=voice_api)
    voice_id = data.get("voice_id", "en-UK-hazel") 
    data = request.get_json()
    text = data.get("text", "Hello! I'm your AI tutor. I'm here to help you learn anything you're curious about. What would you like to explore today?")

    if not text:
        return jsonify({"error": "Missing text"}), 400

    # Call Murf API
    response = client.text_to_speech.generate(
        text=text,
        voice_id=voice_id
    )

    # Return the audio file URL/path to frontend
    return jsonify({"audio_url": response.audio_file})


