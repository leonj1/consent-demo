import pytest
from fastapi.testclient import TestClient

def test_create_checking_account(client: TestClient, sample_customer_data, sample_account_data):
    # Create customer first
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    
    # Update account data with correct customer_id
    account_data = {**sample_account_data, "customer_id": customer_id}
    
    # Create checking account
    response = client.post("/checking-accounts/", json=account_data)
    assert response.status_code == 200
    data = response.json()
    assert data["account_number"] == account_data["account_number"]
    assert data["customer_id"] == customer_id
    assert data["balance"] == "0.00"
    assert data["is_active"] == True
    assert "id" in data
    assert "created_at" in data

def test_create_checking_account_invalid_customer(client: TestClient, sample_account_data):
    # Try to create account with non-existent customer
    account_data = {**sample_account_data, "customer_id": 999}
    response = client.post("/checking-accounts/", json=account_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found"

def test_get_checking_accounts_empty(client: TestClient):
    response = client.get("/checking-accounts/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_checking_accounts(client: TestClient, sample_customer_data, sample_account_data):
    # Create customer and account
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    account_data = {**sample_account_data, "customer_id": customer_id}
    
    create_response = client.post("/checking-accounts/", json=account_data)
    assert create_response.status_code == 200
    
    # Get all accounts
    response = client.get("/checking-accounts/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["account_number"] == account_data["account_number"]

def test_get_checking_account_by_id(client: TestClient, sample_customer_data, sample_account_data):
    # Create customer and account
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    account_data = {**sample_account_data, "customer_id": customer_id}
    
    create_response = client.post("/checking-accounts/", json=account_data)
    account_id = create_response.json()["id"]
    
    # Get account by ID
    response = client.get(f"/checking-accounts/{account_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == account_id
    assert data["account_number"] == account_data["account_number"]

def test_get_checking_account_not_found(client: TestClient):
    response = client.get("/checking-accounts/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Account not found"

def test_get_customer_accounts(client: TestClient, sample_customer_data, sample_account_data, sample_credit_card_data):
    # Create customer
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    
    # Create checking account
    account_data = {**sample_account_data, "customer_id": customer_id}
    client.post("/checking-accounts/", json=account_data)
    
    # Create credit card
    card_data = {**sample_credit_card_data, "customer_id": customer_id}
    client.post("/credit-cards/", json=card_data)
    
    # Get customer accounts
    response = client.get(f"/customers/{customer_id}/accounts")
    assert response.status_code == 200
    data = response.json()
    assert "customer" in data
    assert "checking_accounts" in data
    assert "credit_cards" in data
    assert len(data["checking_accounts"]) == 1
    assert len(data["credit_cards"]) == 1

def test_get_customer_accounts_not_found(client: TestClient):
    response = client.get("/customers/999/accounts")
    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found"