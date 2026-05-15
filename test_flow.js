const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTEsIm5vbWJyZSI6IlN1cGVyIEFkbWluaXN0cmFkb3IiLCJlbWFpbCI6InN1cGVyYWRtaW5AbG9naWNraWRzLmRldiIsInJvbCI6InN1cGVyYWRtaW4iLCJpbnN0aXR1Y2lvbl9pZCI6bnVsbCwiaWF0IjoxNzc4MTExOTMyLCJleHAiOjE3Nzg3MTY3MzJ9.jKVFcx8K_yjzNNLD-58wXMAJRll-31MUsnK0Sx1NQ2s';

async function testFlow() {
  try {
    // 1. Create institution
    const createRes = await fetch("http://localhost:3000/api/admin/instituciones", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ nombre: "Test Colegio AI", ciudad: "TestCity" })
    });
    
    const createData = await createRes.json();
    console.log("Create Response:", createData);
    
    if (!createData.success) {
      console.error("Failed to create institution");
      return;
    }
    
    const adminCreds = createData.data.admin;
    console.log("Admin credentials to test:", adminCreds);
    
    // 2. Try to login with generated credentials
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        email: adminCreds.email, 
        contrasena: adminCreds.contrasena_temporal 
      })
    });
    
    const loginData = await loginRes.json();
    console.log("Login Response with generated creds:", {
      status: loginRes.status,
      data: loginData
    });
    
  } catch (err) {
    console.error("Test failed:", err);
  }
}

testFlow();
