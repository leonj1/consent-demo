import pytest
from fastapi.testclient import TestClient

def test_create_customer(client: TestClient, sample_customer_data):
    response = client.post("/customers/", json=sample_customer_data)
    assert response.status_code == 200
    data = response.json()
    assert data["first_name"] == sample_customer_data["first_name"]
    assert data["last_name"] == sample_customer_data["last_name"]
    assert data["email"] == sample_customer_data["email"]
    assert "id" in data
    assert "created_at" in data

def test_get_customers_empty(client: TestClient):
    response = client.get("/customers/")
    assert response.status_code == 200
    assert response.json() == []

def test_get_customers(client: TestClient, sample_customer_data):
    # Create a customer first
    create_response = client.post("/customers/", json=sample_customer_data)
    assert create_response.status_code == 200
    
    # Get all customers
    response = client.get("/customers/")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["email"] == sample_customer_data["email"]

def test_get_customer_by_id(client: TestClient, sample_customer_data):
    # Create a customer first
    create_response = client.post("/customers/", json=sample_customer_data)
    customer_id = create_response.json()["id"]
    
    # Get customer by ID
    response = client.get(f"/customers/{customer_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == customer_id
    assert data["email"] == sample_customer_data["email"]

def test_get_customer_not_found(client: TestClient):
    response = client.get("/customers/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Customer not found"

def test_create_customer_duplicate_email(client: TestClient, sample_customer_data):
    # Create first customer
    response1 = client.post("/customers/", json=sample_customer_data)
    assert response1.status_code == 200
    
    # Try to create customer with same email - should fail with integrity error
    response2 = client.post("/customers/", json=sample_customer_data)
    # FastAPI returns 500 for unhandled SQLAlchemy IntegrityError
    assert response2.status_code == 500
    assert "Internal Server Error" in response2.text