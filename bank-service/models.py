from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from decimal import Decimal

Base = declarative_base()

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    checking_accounts = relationship("CheckingAccount", back_populates="customer")
    credit_cards = relationship("CreditCard", back_populates="customer")

class CheckingAccount(Base):
    __tablename__ = "checking_accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    account_number = Column(String, unique=True, nullable=False)
    balance = Column(Numeric(precision=10, scale=2), default=Decimal("0.00"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    customer = relationship("Customer", back_populates="checking_accounts")
    transactions = relationship("Transaction", back_populates="account")

class CreditCard(Base):
    __tablename__ = "credit_cards"
    
    id = Column(Integer, primary_key=True, index=True)
    card_number = Column(String, unique=True, nullable=False)
    credit_limit = Column(Numeric(precision=10, scale=2), nullable=False)
    current_balance = Column(Numeric(precision=10, scale=2), default=Decimal("0.00"))
    customer_id = Column(Integer, ForeignKey("customers.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    customer = relationship("Customer", back_populates="credit_cards")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("checking_accounts.id"))
    transaction_type = Column(String, nullable=False)  # "deposit" or "withdrawal"
    amount = Column(Numeric(precision=10, scale=2), nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    account = relationship("CheckingAccount", back_populates="transactions")