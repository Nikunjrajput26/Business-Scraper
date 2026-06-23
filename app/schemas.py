from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, model_validator


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=255)
    company_name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=50)
    password: str = Field(min_length=8)
    confirm_password: str = Field(min_length=8)

    @model_validator(mode="after")
    def passwords_match(self) -> "SignupRequest":
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: Optional[str] = None
    company_name: Optional[str] = None
    phone: Optional[str] = None
    plan: str
    monthly_lead_quota: int
    leads_used_this_period: int
    has_own_api_key: bool = False

    class Config:
        from_attributes = True


class PlanSelectRequest(BaseModel):
    plan: str


class ApiKeyRequest(BaseModel):
    api_key: str = Field(min_length=10, description="Your Google Places API key")


class RunCreateRequest(BaseModel):
    prompt: str = Field(default="", description="Quick prompt, e.g. 'fridge repair in Vadodara'")
    search_terms: List[str] = Field(default_factory=list)
    location: str = Field(default="")
    include_email_scrape: bool = True
    # Google Places Text Search returns at most ~60 results per term
    # (3 pages × 20), so anything above 60 is misleading.
    max_records: int = Field(default=60, ge=1, le=60)


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
