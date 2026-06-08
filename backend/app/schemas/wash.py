from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class WashBase(BaseModel):
    garment_id: int
    washed_date: date
    # Examples: machine, hand, dry_clean, other
    method: str | None = Field(default=None, max_length=50)
    notes: str | None = None


class WashCreate(WashBase):
    pass


class WashRead(WashBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
