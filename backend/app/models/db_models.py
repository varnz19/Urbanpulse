from datetime import datetime
import json
from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text
from app.core.database import Base

class DatasetModel(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_format = Column(String, nullable=False)  # 'csv' or 'arff'
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    columns_meta_json = Column(Text, default="[]")  # List of {name, type, missing, unique, etc.}
    provenance_json = Column(Text, default="{}")
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def columns_meta(self):
        try:
            return json.loads(self.columns_meta_json)
        except Exception:
            return []

    @columns_meta.setter
    def columns_meta(self, value):
        self.columns_meta_json = json.dumps(value)

    @property
    def provenance(self):
        try:
            return json.loads(self.provenance_json)
        except Exception:
            return {}

    @provenance.setter
    def provenance(self, value):
        self.provenance_json = json.dumps(value)


class ExperimentModel(Base):
    __tablename__ = "experiments"

    id = Column(String, primary_key=True, index=True)
    dataset_id = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    task_type = Column(String, nullable=False)  # 'clustering', 'classification', 'association', 'anomaly'
    parameters_json = Column(Text, default="{}")
    metrics_json = Column(Text, default="{}")
    results_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    @property
    def parameters(self):
        try:
            return json.loads(self.parameters_json)
        except Exception:
            return {}

    @parameters.setter
    def parameters(self, value):
        self.parameters_json = json.dumps(value)

    @property
    def metrics(self):
        try:
            return json.loads(self.metrics_json)
        except Exception:
            return {}

    @metrics.setter
    def metrics(self, value):
        self.metrics_json = json.dumps(value)
