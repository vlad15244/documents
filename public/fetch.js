document.addEventListener('DOMContentLoaded', () => {      
      const orderStatus = document.getElementById('orderStatus');
      const status = orderStatus.selectedIndex;

      console.log(status);
      function updateTabel(){

          fetch('/filter', {
              method : 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 'status' : status})          
          })
              .then(response => response.json())
              .then(data => {
              console.log(data)

              })
              .catch(error => console.error('Error updating table:', error));
      }

    orderStatus.addEventListener('change', updateTabel);
    });