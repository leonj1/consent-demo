import pytest
from fastapi.testclient import TestClient

def create_customer_and_account(client: TestClient, sample_customer_data, sample_account_data):
    """Helper function to create customer and account for testing"""
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    
    account_data = {**sample_account_data, "customer_id": customer_id}
    account_response = client.post("/checking-accounts/", json=account_data)
    account_id = account_response.json()["id"]
    
    return customer_id, account_id

def test_deposit_funds_success(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    deposit_data = {"amount": 100.50, "description": "Initial deposit"}
    response = client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "Successfully deposited $100.5" in data["message"]
    assert float(data["new_balance"]) == 100.50

def test_deposit_funds_invalid_amount(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    deposit_data = {"amount": -50.00, "description": "Invalid deposit"}
    response = client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Deposit amount must be positive"

def test_deposit_funds_zero_amount(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    deposit_data = {"amount": 0.00, "description": "Zero deposit"}
    response = client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Deposit amount must be positive"

def test_deposit_funds_account_not_found(client: TestClient):
    deposit_data = {"amount": 100.00, "description": "Deposit to non-existent account"}
    response = client.post("/checking-accounts/999/deposit", json=deposit_data)
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Account not found"

def test_withdraw_funds_success(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    # First deposit some money
    deposit_data = {"amount": 200.00, "description": "Initial deposit"}
    client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data)
    
    # Then withdraw
    withdrawal_data = {"amount": 75.25, "description": "ATM withdrawal"}
    response = client.post(f"/checking-accounts/{account_id}/withdraw", json=withdrawal_data)
    
    assert response.status_code == 200
    data = response.json()
    assert "Successfully withdrew $75.25" in data["message"]
    assert float(data["new_balance"]) == 124.75

def test_withdraw_funds_insufficient_balance(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    # Try to withdraw from empty account
    withdrawal_data = {"amount": 50.00, "description": "Overdraft attempt"}
    response = client.post(f"/checking-accounts/{account_id}/withdraw", json=withdrawal_data)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Insufficient funds"

def test_withdraw_funds_invalid_amount(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    withdrawal_data = {"amount": -25.00, "description": "Invalid withdrawal"}
    response = client.post(f"/checking-accounts/{account_id}/withdraw", json=withdrawal_data)
    
    assert response.status_code == 400
    assert response.json()["detail"] == "Withdrawal amount must be positive"

def test_withdraw_funds_account_not_found(client: TestClient):
    withdrawal_data = {"amount": 50.00, "description": "Withdrawal from non-existent account"}
    response = client.post("/checking-accounts/999/withdraw", json=withdrawal_data)
    
    assert response.status_code == 404
    assert response.json()["detail"] == "Account not found"

def test_multiple_transactions_balance_accuracy(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    # Series of deposits and withdrawals
    transactions = [
        ("deposit", 1000.00),
        ("withdraw", 250.00),
        ("deposit", 150.50),
        ("withdraw", 100.25),
    ]
    
    expected_balance = 0.00
    for transaction_type, amount in transactions:
        if transaction_type == "deposit":
            data = {"amount": amount, "description": f"Test {transaction_type}"}
            response = client.post(f"/checking-accounts/{account_id}/deposit", json=data)
            expected_balance += amount
        else:
            data = {"amount": amount, "description": f"Test {transaction_type}"}
            response = client.post(f"/checking-accounts/{account_id}/withdraw", json=data)
            expected_balance -= amount
        
        assert response.status_code == 200
        assert float(response.json()["new_balance"]) == expected_balance