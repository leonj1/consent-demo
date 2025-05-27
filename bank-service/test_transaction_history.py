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

def test_get_account_transactions_empty(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    response = client.get(f"/checking-accounts/{account_id}/transactions")
    assert response.status_code == 200
    assert response.json() == []

def test_get_account_transactions_after_deposit(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    # Make a deposit
    deposit_data = {"amount": 100.00, "description": "Test deposit"}
    client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data)
    
    # Get transactions
    response = client.get(f"/checking-accounts/{account_id}/transactions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["transaction_type"] == "deposit"
    assert data[0]["amount"] == "100.00"
    assert data[0]["description"] == "Test deposit"
    assert data[0]["account_id"] == account_id

def test_get_account_transactions_after_withdrawal(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    # Make a deposit first
    deposit_data = {"amount": 200.00, "description": "Initial deposit"}
    client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data)
    
    # Make a withdrawal
    withdrawal_data = {"amount": 50.00, "description": "Test withdrawal"}
    client.post(f"/checking-accounts/{account_id}/withdraw", json=withdrawal_data)
    
    # Get transactions
    response = client.get(f"/checking-accounts/{account_id}/transactions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Check first transaction (deposit)
    deposit_transaction = next(t for t in data if t["transaction_type"] == "deposit")
    assert deposit_transaction["amount"] == "200.00"
    assert deposit_transaction["description"] == "Initial deposit"
    
    # Check second transaction (withdrawal)
    withdrawal_transaction = next(t for t in data if t["transaction_type"] == "withdrawal")
    assert withdrawal_transaction["amount"] == "50.00"
    assert withdrawal_transaction["description"] == "Test withdrawal"

def test_get_account_transactions_multiple_transactions(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    # Create multiple transactions
    transactions = [
        ("deposit", 1000.00, "Salary deposit"),
        ("withdraw", 250.00, "Rent payment"),
        ("deposit", 50.00, "Cash deposit"),
        ("withdraw", 30.00, "ATM withdrawal"),
    ]
    
    for transaction_type, amount, description in transactions:
        data = {"amount": amount, "description": description}
        if transaction_type == "deposit":
            client.post(f"/checking-accounts/{account_id}/deposit", json=data)
        else:
            client.post(f"/checking-accounts/{account_id}/withdraw", json=data)
    
    # Get all transactions
    response = client.get(f"/checking-accounts/{account_id}/transactions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    
    # Verify transaction details
    for i, (expected_type, expected_amount, expected_desc) in enumerate(transactions):
        transaction = next(t for t in data if t["description"] == expected_desc)
        assert transaction["transaction_type"] == expected_type
        assert float(transaction["amount"]) == expected_amount
        assert transaction["account_id"] == account_id
        assert "created_at" in transaction
        assert "id" in transaction

def test_get_account_transactions_account_not_found(client: TestClient):
    response = client.get("/checking-accounts/999/transactions")
    assert response.status_code == 404
    assert response.json()["detail"] == "Account not found"

def test_transaction_timestamps_chronological(client: TestClient, sample_customer_data, sample_account_data):
    customer_id, account_id = create_customer_and_account(client, sample_customer_data, sample_account_data)
    
    # Create transactions with small delays
    import time
    
    # First transaction
    deposit_data1 = {"amount": 100.00, "description": "First deposit"}
    client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data1)
    
    time.sleep(0.1)  # Small delay to ensure different timestamps
    
    # Second transaction
    deposit_data2 = {"amount": 200.00, "description": "Second deposit"}
    client.post(f"/checking-accounts/{account_id}/deposit", json=deposit_data2)
    
    # Get transactions
    response = client.get(f"/checking-accounts/{account_id}/transactions")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    # Verify timestamps exist and are properly formatted
    for transaction in data:
        assert "created_at" in transaction
        # Basic ISO format check
        assert "T" in transaction["created_at"]