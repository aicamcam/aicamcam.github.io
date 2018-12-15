# -*- coding: utf-8 -*-

from flask import Flask
from flask_flatpages import FlatPages
from flask_frozen import Freezer
import aicamcam


app = Flask(__name__, instance_relative_config=True)
app.config.from_mapping(
    SECRET_KEY='dev',
)

app.config.from_pyfile('settings.py')
pages = FlatPages(app)
freezer = Freezer(app)

# ensure the instance folder exist    
app.register_blueprint(aicamcam.bp)

if __name__ == '__main__':
    app.run()