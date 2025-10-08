from flask import Blueprint
from controllers.llm_controllers import generate_content, tts

llm_routes = Blueprint("llm_routes", __name__)

llm_routes.route('/', methods=['POST'])(generate_content)
llm_routes.route('/tts', methods=['POST'])(tts)

