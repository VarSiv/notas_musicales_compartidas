<!-- Incluí esto en el <head> de tu HTML -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">

  <footer class="footer">
    <div class="footer-left">
      <p>Visualización de Datos<br />Trabajo Final 2025</p>
    </div>

    <div class="music-link">
      <a href="https://open.spotify.com/playlist/5KTRqBn3tfSEO7w8vlDcJq?si=Bdv5OFhzSHCFlDxG_BYpHg&pi=LYS-qQbASbOyF" target="_blank">
        <i class="fab fa-spotify"></i> Nuestra playlist
      </a>
    </div>
    
    <div class="footer-right">
      <p class="instagram-links">
        <a href="https://www.instagram.com/stefanyred/" target="_blank">
          <i class="fab fa-instagram"></i> Steffy
        </a> -
        <a href="https://www.instagram.com/varvaramironov_/" target="_blank">
          <i class="fab fa-instagram"></i> Var
        </a> -
        <a href="https://www.instagram.com/rochitagle4934/" target="_blank">
          <i class="fab fa-instagram"></i> Rosita
        </a>
      </p>
    </div>
    
    
  </footer>
  
  <style>
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    background-color: #e0fdfa;
    border-top: 2px solid #add8e6;
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
    color: black;
    font-size: 14px;
    flex-wrap: wrap;
    margin-top: 40px;
  }
  
  .footer-left,
  .footer-right {
    text-align: left;
  }
  
  .footer-right {
    text-align: right;
  }
  
  .instagram-links a {
  text-decoration: none;
  color: #0d2de2;
  font-weight: 500;
  margin-left: 5px;
  transition: color 0.3s ease;
}

.instagram-links a:first-child {
  margin-left: 0;
}

.instagram-links a i {
  color: #E1306C; /* Color clásico de Instagram */
  margin-right: 5px;
}

.instagram-links a:hover {
  color: #ff1c68;
}


  .music-link {
  margin-top: 10px;
}

.music-link a {
  color: #009d37;
  text-decoration: none;
  font-weight: 500;
  font-size: 18px;
  transition: color 0.3s ease;
}

.music-link a i {
  margin-right: 6px;
}

.music-link a:hover {
  color: #17a34a;
}

  </style>
  