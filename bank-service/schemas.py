from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr

class CustomerCreate(CustomerBase):
    pass

class Customer(CustomerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class CheckingAccountBase(BaseModel):
    account_number: str

class CheckingAccountCreate(CheckingAccountBase):
    customer_id: int

class CheckingAccount(CheckingAccountBase):
    id: int
    balance: Decimal
    customer_id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class CreditCardBase(BaseModel):
    card_number: str
    credit_limit: Decimal

class CreditCardCreate(CreditCardBase):
    customer_id: int

class CreditCard(CreditCardBase):
    id: int
    current_balance: Decimal
    customer_id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class TransactionBase(BaseModel):
    amount: Decimal
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    transaction_type: str

class Transaction(TransactionBase):
    id: int
    account_id: int
    transaction_type: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class DepositRequest(BaseModel):
    amount: Decimal
    description: Optional[str] = "Deposit"

class WithdrawalRequest(BaseModel):
    amount: Decimal
    description: Optional[str] = "Withdrawal"