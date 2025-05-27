import pytest
from fastapi.testclient import TestClient

def test_create_credit_card(client: TestClient, sample_customer_data, sample_credit_card_data):
    # Create customer first
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    
    # Update credit card data with correct customer_id
    card_data = {**sample_credit_card_data, "customer_id": customer_id}
    
    # Create credit card
    response = client.post("/credit-cards/", json=card_data)
    assert response.status_code == 200
    data = response.json()
    assert data["card_number"] == card_data["card_number"]
    assert data["customer_id"] == customer_id
    assert data["credit_limit"] == str(card_data["credit_limit"])
    assert data["current_balance"] == "0.00"
    assert data["is_active"] == True
    assert "id" in data
    assert "created_at" in data

def test_create_credit_card_invalid_customer(client: TestClient, sample_credit_card_data):
    # Try to create credit card with non-existent customer
    card_data = {**sample_credit_card_data, "customer_id": 999}
    response = client.post("/credit-cards/", json=card_data)
    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found"

def test_get_credit_cards_empty(client: TestClient):
    response = client.get("/credit-cards/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_credit_cards(client: TestClient, sample_customer_data, sample_credit_card_data):
    # Create customer and credit card
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    card_data = {**sample_credit_card_data, "customer_id": customer_id}
    
    create_response = client.post("/credit-cards/", json=card_data)
    assert create_response.status_code == 200
    
    # Get all credit cards
    response = client.get("/credit-cards/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["card_number"] == card_data["card_number"]

def test_get_credit_card_by_id(client: TestClient, sample_customer_data, sample_credit_card_data):
    # Create customer and credit card
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    card_data = {**sample_credit_card_data, "customer_id": customer_id}
    
    create_response = client.post("/credit-cards/", json=card_data)
    card_id = create_response.json()["id"]
    
    # Get credit card by ID
    response = client.get(f"/credit-cards/{card_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == card_id
    assert data["card_number"] == card_data["card_number"]

def test_get_credit_card_not_found(client: TestClient):
    response = client.get("/credit-cards/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Credit card not found"

def test_create_multiple_credit_cards_same_customer(client: TestClient, sample_customer_data, sample_credit_card_data):
    # Create customer
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    
    # Create first credit card
    card_data_1 = {
        "card_number": "4111111111111111",
        "credit_limit": 5000.00,
        "customer_id": customer_id
    }
    response1 = client.post("/credit-cards/", json=card_data_1)
    assert response1.status_code == 200
    
    # Create second credit card with different number
    card_data_2 = {
        "card_number": "4222222222222222",
        "credit_limit": 10000.00,
        "customer_id": customer_id
    }
    response2 = client.post("/credit-cards/", json=card_data_2)
    assert response2.status_code == 200
    
    # Verify both cards exist
    response = client.get("/credit-cards/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2

def test_create_credit_card_duplicate_number(client: TestClient, sample_customer_data, sample_credit_card_data):
    # Create customer
    customer_response = client.post("/customers/", json=sample_customer_data)
    customer_id = customer_response.json()["id"]
    
    # Create first credit card
    card_data = {**sample_credit_card_data, "customer_id": customer_id}
    response1 = client.post("/credit-cards/", json=card_data)
    assert response1.status_code == 200
    
    # Try to create credit card with same number
    response2 = client.post("/credit-cards/", json=card_data)
    assert response2.status_code == 500  # SQLAlchemy IntegrityError