from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, model_validator


class WearBase(BaseModel):
    worn_date: date
    garment_id: int | None = None
    outfit_id: int | None = None
    notes: str | None = None

    @model_validator(mode="after")
    def require_target(self) -> "WearBase":
        if self.garment_id is None and self.outfit_id is None:
            raise ValueError("A wear must reference a garment_id, an outfit_id, or both.")
        return self


class WearCreate(WearBase):
    pass


class WearRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    worn_date: date
    garment_id: int | None
    outfit_id: int | None
    notes: str | None
    created_at: datetime
