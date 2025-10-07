# 📧 TEMPLATE EMAIL PROFESSIONALI - SISTEMA RICHIESTA ASSISTENZA

## 1. EMAIL DI BENVENUTO
**Codice:** `welcome_email`  
**Oggetto:** Benvenuto in Richiesta Assistenza - Il tuo account è attivo!

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benvenuto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Benvenuto {{userName}}! 🎉</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Il tuo account è stato creato con successo</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Siamo felici di averti con noi!</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Grazie per aver scelto <strong>Richiesta Assistenza</strong>, la piattaforma leader per trovare professionisti qualificati per ogni tua esigenza.
                            </p>
                            
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">✨ Cosa puoi fare ora:</h3>
                                <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.8;">
                                    <li>Richiedi assistenza per qualsiasi necessità</li>
                                    <li>Ricevi preventivi gratuiti da professionisti verificati</li>
                                    <li>Confronta prezzi e recensioni</li>
                                    <li>Prenota interventi in pochi click</li>
                                    <li>Traccia lo stato delle tue richieste in tempo reale</li>
                                </ul>
                            </div>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{loginLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Accedi al tuo Account
                                </a>
                            </div>
                            
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                                    💡 Suggerimento: Completa il tuo profilo per ricevere preventivi più accurati!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai bisogno di aiuto? Contattaci:
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #667eea; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 2. RESET PASSWORD
**Codice:** `password_reset`  
**Oggetto:** Reimposta la tua password - Richiesta Assistenza

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Reset Password 🔐</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Reimposta la tua password in modo sicuro</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Abbiamo ricevuto una richiesta di reset password per il tuo account. Se non hai effettuato tu questa richiesta, puoi ignorare questa email.
                            </p>
                            
                            <div style="background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 25px 0;">
                                <p style="color: #856404; margin: 0; font-weight: 600;">
                                    ⚠️ Attenzione: Questo link scadrà tra {{expiryTime}} ore per motivi di sicurezza.
                                </p>
                            </div>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{resetLink}}" style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);">
                                    Reimposta Password
                                </a>
                            </div>
                            
                            <p style="color: #999999; font-size: 14px; text-align: center; margin: 20px 0;">
                                Se il pulsante non funziona, copia e incolla questo link nel browser:
                            </p>
                            <p style="color: #667eea; font-size: 14px; text-align: center; word-break: break-all;">
                                {{resetLink}}
                            </p>
                            
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">🔒 Suggerimenti per una password sicura:</h3>
                                <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                                    <li>Usa almeno 8 caratteri</li>
                                    <li>Includi lettere maiuscole e minuscole</li>
                                    <li>Aggiungi numeri e simboli speciali</li>
                                    <li>Non usare informazioni personali facilmente indovinabili</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Non hai richiesto il reset? Ignora questa email o contattaci se hai dubbi.
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:security@richiestaassistenza.it" style="color: #f5576c; text-decoration: none; font-weight: 600;">security@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 3. RICHIESTA CREATA
**Codice:** `request_created`  
**Oggetto:** Richiesta #{{requestId}} creata con successo

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Richiesta Creata</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Richiesta Ricevuta! ✅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">La tua richiesta è stata presa in carico</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                La tua richiesta di assistenza è stata registrata con successo. I nostri professionisti qualificati la stanno già esaminando.
                            </p>
                            
                            <!-- Dettagli Richiesta -->
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">📋 Dettagli della Richiesta:</h3>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>ID Richiesta:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            #{{requestId}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Titolo:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{requestTitle}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Categoria:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{category}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Data Creazione:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{createdDate}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Timeline -->
                            <div style="margin: 30px 0;">
                                <h3 style="color: #333333; margin: 0 0 20px 0; font-size: 18px;">⏱️ Prossimi Passi:</h3>
                                <div style="position: relative; padding-left: 30px;">
                                    <div style="position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background-color: #e0e0e0;"></div>
                                    
                                    <div style="position: relative; margin-bottom: 20px;">
                                        <div style="position: absolute; left: -25px; top: 5px; width: 12px; height: 12px; background-color: #4caf50; border-radius: 50%;"></div>
                                        <div style="color: #4caf50; font-weight: 600; margin-bottom: 5px;">✓ Richiesta Creata</div>
                                        <div style="color: #666666; font-size: 14px;">La tua richiesta è stata registrata</div>
                                    </div>
                                    
                                    <div style="position: relative; margin-bottom: 20px;">
                                        <div style="position: absolute; left: -25px; top: 5px; width: 12px; height: 12px; background-color: #ffc107; border-radius: 50%;"></div>
                                        <div style="color: #333333; font-weight: 600; margin-bottom: 5px;">In Elaborazione</div>
                                        <div style="color: #666666; font-size: 14px;">I professionisti stanno valutando la richiesta</div>
                                    </div>
                                    
                                    <div style="position: relative;">
                                        <div style="position: absolute; left: -25px; top: 5px; width: 12px; height: 12px; background-color: #e0e0e0; border-radius: 50%;"></div>
                                        <div style="color: #999999; font-weight: 600; margin-bottom: 5px;">Ricezione Preventivi</div>
                                        <div style="color: #999999; font-size: 14px;">Entro 24-48 ore</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{requestLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Visualizza Richiesta
                                </a>
                            </div>
                            
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                                    💡 Riceverai una notifica appena arriveranno i primi preventivi!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai domande sulla tua richiesta?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #667eea; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 4. PREVENTIVO RICEVUTO
**Codice:** `quote_received`  
**Oggetto:** Nuovo preventivo per la tua richiesta #{{requestId}}

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Preventivo Ricevuto</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Nuovo Preventivo! 💰</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">Un professionista ha inviato un'offerta</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Ottime notizie! Hai ricevuto un nuovo preventivo per la tua richiesta di assistenza.
                            </p>
                            
                            <!-- Preventivo Card -->
                            <div style="border: 2px solid #4facfe; border-radius: 8px; padding: 20px; margin: 25px 0; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">IMPORTO PREVENTIVO</div>
                                    <div style="font-size: 36px; color: #333333; font-weight: bold;">{{quoteAmount}}</div>
                                </div>
                                
                                <table style="width: 100%; margin-top: 20px;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Professionista:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{professionalName}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Per richiesta:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{requestTitle}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Valutazione:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #ffc107; text-align: right;">
                                            ⭐⭐⭐⭐⭐ {{professionalRating}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Validità:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{validityDays}} giorni
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- CTA Buttons -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{quoteLink}}" style="display: inline-block; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; margin: 0 10px 10px 0; box-shadow: 0 4px 15px rgba(79, 172, 254, 0.4);">
                                    Visualizza Dettagli
                                </a>
                                <a href="{{compareLink}}" style="display: inline-block; background: #ffffff; color: #4facfe; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; border: 2px solid #4facfe;">
                                    Confronta Preventivi
                                </a>
                            </div>
                            
                            <!-- Info Box -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #856404; margin: 0; font-weight: 600;">
                                    💡 Suggerimento: Confronta almeno 3 preventivi prima di decidere!
                                </p>
                            </div>
                            
                            <!-- Features -->
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">Con Richiesta Assistenza puoi:</h3>
                                <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                                    <li>Chattare con il professionista per chiarimenti</li>
                                    <li>Richiedere modifiche al preventivo</li>
                                    <li>Accettare con un click quando sei pronto</li>
                                    <li>Pagare in sicurezza tramite la piattaforma</li>
                                </ul>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai domande sul preventivo?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #4facfe; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 5. INTERVENTO PROGRAMMATO
**Codice:** `intervention_scheduled`  
**Oggetto:** Appuntamento confermato per {{date}} alle {{time}}

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Intervento Programmato</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Appuntamento Confermato! 📅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">L'intervento è stato programmato</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Ciao {{userName}},</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Il tuo appuntamento con il professionista è stato confermato. Ecco tutti i dettagli:
                            </p>
                            
                            <!-- Appointment Card -->
                            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 25px; margin: 25px 0; color: #ffffff;">
                                <div style="text-align: center;">
                                    <div style="font-size: 48px; margin-bottom: 10px;">📅</div>
                                    <div style="font-size: 24px; font-weight: bold; margin-bottom: 5px;">{{date}}</div>
                                    <div style="font-size: 32px; font-weight: bold;">{{time}}</div>
                                </div>
                            </div>
                            
                            <!-- Details -->
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 18px;">📍 Dettagli Intervento:</h3>
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Professionista:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{professionalName}}<br>
                                            <span style="color: #ffc107;">⭐ {{professionalRating}}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Servizio:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{serviceType}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Indirizzo:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{address}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Durata stimata:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{estimatedDuration}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666; vertical-align: top;">
                                            <strong>Costo concordato:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right; font-size: 18px; font-weight: bold;">
                                            {{agreedAmount}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Reminder Box -->
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <h3 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 16px;">✅ Cosa fare prima dell'intervento:</h3>
                                <ul style="color: #2e7d32; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                                    <li>Assicurati di essere presente all'orario concordato</li>
                                    <li>Prepara l'area di intervento se necessario</li>
                                    <li>Tieni a portata di mano eventuali documenti richiesti</li>
                                </ul>
                            </div>
                            
                            <!-- Action Buttons -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{appointmentLink}}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; margin: 0 10px 10px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    Visualizza Dettagli
                                </a>
                                <a href="{{rescheduleLink}}" style="display: inline-block; background: #ffffff; color: #667eea; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; border: 2px solid #667eea;">
                                    Modifica Appuntamento
                                </a>
                            </div>
                            
                            <!-- Contact Info -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #856404; margin: 0;">
                                    <strong>📞 Contatto professionista:</strong> {{professionalPhone}}
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Devi modificare o cancellare l'appuntamento?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:support@richiestaassistenza.it" style="color: #667eea; text-decoration: none; font-weight: 600;">support@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 6. PAGAMENTO CONFERMATO
**Codice:** `payment_success`  
**Oggetto:** Pagamento confermato - Fattura #{{invoiceNumber}}

```html
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pagamento Confermato</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; padding: 20px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 600;">Pagamento Confermato! ✅</h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">La transazione è andata a buon fine</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Grazie {{userName}}!</h2>
                            
                            <p style="color: #666666; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                                Il tuo pagamento è stato elaborato con successo. Ecco il riepilogo della transazione:
                            </p>
                            
                            <!-- Invoice Card -->
                            <div style="border: 2px solid #38ef7d; border-radius: 8px; padding: 20px; margin: 25px 0; background-color: #f0fdf4;">
                                <div style="text-align: center; margin-bottom: 20px;">
                                    <div style="font-size: 14px; color: #666666; margin-bottom: 5px;">IMPORTO PAGATO</div>
                                    <div style="font-size: 36px; color: #11998e; font-weight: bold;">{{amount}}</div>
                                    <div style="color: #4caf50; font-size: 14px; margin-top: 5px;">✓ Pagamento Completato</div>
                                </div>
                                
                                <hr style="border: none; border-top: 1px dashed #d0d0d0; margin: 20px 0;">
                                
                                <table style="width: 100%;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Fattura N°:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            #{{invoiceNumber}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Data:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{paymentDate}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Metodo:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{paymentMethod}}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #666666;">
                                            <strong>Servizio:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #333333; text-align: right;">
                                            {{serviceDescription}}
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Download Button -->
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="{{downloadLink}}" style="display: inline-block; background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 50px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(56, 239, 125, 0.4);">
                                    📥 Scarica Fattura PDF
                                </a>
                            </div>
                            
                            <!-- Info Box -->
                            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 25px 0;">
                                <h3 style="color: #333333; margin: 0 0 15px 0; font-size: 16px;">📋 Informazioni Importanti:</h3>
                                <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
                                    <li>La fattura è disponibile per il download per 30 giorni</li>
                                    <li>Una copia è stata salvata nel tuo account</li>
                                    <li>Puoi richiedere una copia via email in qualsiasi momento</li>
                                    <li>Per assistenza fiscale, contatta il nostro supporto</li>
                                </ul>
                            </div>
                            
                            <!-- Thank You Message -->
                            <div style="background-color: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 25px 0; border-radius: 4px;">
                                <p style="color: #2e7d32; margin: 0; font-weight: 600;">
                                    🙏 Grazie per aver scelto Richiesta Assistenza!
                                </p>
                                <p style="color: #2e7d32; margin: 5px 0 0 0; font-size: 14px;">
                                    La tua fiducia è importante per noi.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                            <p style="color: #999999; margin: 0 0 10px 0; font-size: 14px;">
                                Hai bisogno di assistenza con la fattura?
                            </p>
                            <p style="margin: 0 0 15px 0;">
                                <a href="mailto:billing@richiestaassistenza.it" style="color: #11998e; text-decoration: none; font-weight: 600;">billing@richiestaassistenza.it</a>
                            </p>
                            <p style="color: #999999; margin: 0; font-size: 12px;">
                                © 2025 Richiesta Assistenza. Tutti i diritti riservati.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## VARIABILI DISPONIBILI PER OGNI TEMPLATE

### Email di Benvenuto
- `{{userName}}` - Nome dell'utente
- `{{loginLink}}` - Link per accedere

### Reset Password
- `{{userName}}` - Nome dell'utente
- `{{resetLink}}` - Link per reset password
- `{{expiryTime}}` - Ore di validità del link

### Richiesta Creata
- `{{userName}}` - Nome dell'utente
- `{{requestId}}` - ID della richiesta
- `{{requestTitle}}` - Titolo della richiesta
- `{{category}}` - Categoria del servizio
- `{{createdDate}}` - Data di creazione
- `{{requestLink}}` - Link alla richiesta

### Preventivo Ricevuto
- `{{userName}}` - Nome del cliente
- `{{professionalName}}` - Nome del professionista
- `{{quoteAmount}}` - Importo del preventivo
- `{{requestTitle}}` - Titolo della richiesta
- `{{professionalRating}}` - Valutazione del professionista
- `{{validityDays}}` - Giorni di validità
- `{{quoteLink}}` - Link al preventivo
- `{{compareLink}}` - Link per confrontare preventivi

### Intervento Programmato
- `{{userName}}` - Nome del cliente
- `{{professionalName}}` - Nome del professionista
- `{{date}}` - Data dell'intervento
- `{{time}}` - Ora dell'intervento
- `{{serviceType}}` - Tipo di servizio
- `{{address}}` - Indirizzo dell'intervento
- `{{estimatedDuration}}` - Durata stimata
- `{{agreedAmount}}` - Importo concordato
- `{{professionalPhone}}` - Telefono del professionista
- `{{professionalRating}}` - Valutazione
- `{{appointmentLink}}` - Link all'appuntamento
- `{{rescheduleLink}}` - Link per riprogrammare

### Pagamento Confermato
- `{{userName}}` - Nome del cliente
- `{{amount}}` - Importo pagato
- `{{invoiceNumber}}` - Numero fattura
- `{{paymentDate}}` - Data del pagamento
- `{{paymentMethod}}` - Metodo di pagamento
- `{{serviceDescription}}` - Descrizione del servizio
- `{{downloadLink}}` - Link per scaricare la fattura
