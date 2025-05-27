from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
import models
import schemas
from database import get_db, create_tables
import uuid

app = FastAPI(
    title="Bank Service API",
    description="A banking API to manage checking accounts, deposits, withdrawals, and credit cards",
    version="1.0.0"
)

# Create tables on startup
create_tables()

# Customer endpoints
@app.post("/customers/", response_model=schemas.Customer)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    db_customer = models.Customer(**customer.dict())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@app.get("/customers/", response_model=List[schemas.Customer])
def get_customers(db: Session = Depends(get_db)):
    return db.query(models.Customer).all()

@app.get("/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

# Checking Account endpoints
@app.post("/checking-accounts/", response_model=schemas.CheckingAccount)
def create_checking_account(account: schemas.CheckingAccountCreate, db: Session = Depends(get_db)):
    # Check if customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == account.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_account = models.CheckingAccount(**account.dict())
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account

@app.get("/checking-accounts/", response_model=List[schemas.CheckingAccount])
def get_checking_accounts(db: Session = Depends(get_db)):
    return db.query(models.CheckingAccount).all()

@app.get("/checking-accounts/{account_id}", response_model=schemas.CheckingAccount)
def get_checking_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.CheckingAccount).filter(models.CheckingAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account

@app.post("/checking-accounts/{account_id}/deposit")
def deposit_funds(account_id: int, deposit: schemas.DepositRequest, db: Session = Depends(get_db)):
    account = db.query(models.CheckingAccount).filter(models.CheckingAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if deposit.amount <= 0:
        raise HTTPException(status_code=400, detail="Deposit amount must be positive")
    
    account.balance += deposit.amount
    
    # Create transaction record
    transaction = models.Transaction(
        account_id=account_id,
        transaction_type="deposit",
        amount=deposit.amount,
        description=deposit.description
    )
    db.add(transaction)
    db.commit()
    db.refresh(account)
    
    return {"message": f"Successfully deposited ${deposit.amount}", "new_balance": account.balance}

@app.post("/checking-accounts/{account_id}/withdraw")
def withdraw_funds(account_id: int, withdrawal: schemas.WithdrawalRequest, db: Session = Depends(get_db)):
    account = db.query(models.CheckingAccount).filter(models.CheckingAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if withdrawal.amount <= 0:
        raise HTTPException(status_code=400, detail="Withdrawal amount must be positive")
    
    if account.balance < withdrawal.amount:
        raise HTTPException(status_code=400, detail="Insufficient funds")
    
    account.balance -= withdrawal.amount
    
    # Create transaction record
    transaction = models.Transaction(
        account_id=account_id,
        transaction_type="withdrawal",
        amount=withdrawal.amount,
        description=withdrawal.description
    )
    db.add(transaction)
    db.commit()
    db.refresh(account)
    
    return {"message": f"Successfully withdrew ${withdrawal.amount}", "new_balance": account.balance}

@app.get("/checking-accounts/{account_id}/transactions", response_model=List[schemas.Transaction])
def get_account_transactions(account_id: int, db: Session = Depends(get_db)):
    account = db.query(models.CheckingAccount).filter(models.CheckingAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return db.query(models.Transaction).filter(models.Transaction.account_id == account_id).all()

# Credit Card endpoints
@app.post("/credit-cards/", response_model=schemas.CreditCard)
def create_credit_card(card: schemas.CreditCardCreate, db: Session = Depends(get_db)):
    # Check if customer exists
    customer = db.query(models.Customer).filter(models.Customer.id == card.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    db_card = models.CreditCard(**card.dict())
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    return db_card

@app.get("/credit-cards/", response_model=List[schemas.CreditCard])
def get_credit_cards(db: Session = Depends(get_db)):
    return db.query(models.CreditCard).all()

@app.get("/credit-cards/{card_id}", response_model=schemas.CreditCard)
def get_credit_card(card_id: int, db: Session = Depends(get_db)):
    card = db.query(models.CreditCard).filter(models.CreditCard.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Credit card not found")
    return card

@app.get("/customers/{customer_id}/accounts")
def get_customer_accounts(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    checking_accounts = db.query(models.CheckingAccount).filter(models.CheckingAccount.customer_id == customer_id).all()
    credit_cards = db.query(models.CreditCard).filter(models.CreditCard.customer_id == customer_id).all()
    
    return {
        "customer": customer,
        "checking_accounts": checking_accounts,
        "credit_cards": credit_cards
    }

@app.get("/")
def root():
    return {"message": "Welcome to Bank Service API! Visit /docs for Swagger documentation"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)