path=/" + location.pathname.split("/")[1];"); 
    });
    alert("Tutti i cookie sono stati cancellati!");
    location.reload();
  }
}

// Conta i cookie attuali
window.onload = function() {
  const cookieCount = document.cookie.split(";").length;
  const elem = document.getElementById("cookie-count");
  if (elem) {
    elem.innerHTML = `Stai utilizzando <strong>${cookieCount} cookie</strong> su questo sito`;
  }
}
</script>
',
  'Testo semplificato della cookie policy...',
  'Prima versione completa della Cookie Policy conforme a GDPR e Direttiva ePrivacy',
  'Versione iniziale completa con tutte le informazioni richieste',
  '2025-01-18',
  'PUBLISHED',
  'it',
  NOW(),
  NOW()
);