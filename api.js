const axios = require('axios');

const fetchData = async () => {
  const options = {
    method: 'POST',
    url: 'https://rto-vehicle-information-verification-india.p.rapidapi.com/api/v1/rc/vehicleinfo',
    headers: {
      'content-type': 'application/json',
      'X-RapidAPI-Key': '952659701amsh985387c5fbd45eep1f2a80jsn53547a72f9fb',
      'X-RapidAPI-Host': 'rto-vehicle-information-verification-india.p.rapidapi.com'
    },
    data: {
      reg_no: 'HR26DK8337',
      consent: 'Y',
      consent_text: 'I hear by declare my consent agreement for fetching my information via AITAN Labs API'
    }
  };

  try {
    const response = await axios.request(options);
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

// Call the function
fetchData();