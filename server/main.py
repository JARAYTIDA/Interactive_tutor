from flask import Flask
from flask_cors import CORS
from config import Config
from routes.llm_routes import llm_routes

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/*": {"origins": "*"}})

    app.register_blueprint(llm_routes, url_prefix="/")

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=app.config["PORT"], debug=False)
