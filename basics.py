from sqlalchemy import create_engine

engine = create_engine('sqlite:///mydatabase.db',echo=True)