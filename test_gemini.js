const apiKey = 'AIzaSyAJOrj6IJe3Ip6MiUWAfl6GpRNFa74msRE';
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
    if (data.models) {
      console.log('SUCCESS! Models found:');
      console.log(data.models.map(m => m.name).join(', '));
    } else {
      console.error('ERROR RESPONSE:', data);
    }
  })
  .catch(err => console.error('FETCH ERROR:', err));
