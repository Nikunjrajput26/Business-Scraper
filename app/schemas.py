from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    plan: str
    monthly_lead_quota: int
    leads_used_this_period: int

    class Config:
        from_attributes = True


class RunCreateRequest(BaseModel):
    prompt: str = Field(default="", description="Quick prompt, e.g. 'fridge repair in Vadodara'")
    search_terms: List[str] = Field(default_factory=list)
    location: str = Field(default="")
    include_email_scrape: bool = True
    max_records: int = Field(default=200, ge=1, le=5000)


class LeadResponse(BaseModel):
    id: str
    business_name: str
    phone_number: str
    website: str
    address: str
    rating: str
    total_reviews: str
    category: str
    city: str
    country: str
    email: str

    class Config:
        from_attributes = True


class RunResponse(BaseModel):
    id: str
    search_terms: str
    location_query: str
    status: str
    error_message: Optional[str] = None
    record_count: int
    created_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True
