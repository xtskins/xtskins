import * as React from 'react'

interface EmailTemplateProps {
  firstName: string
  email: string
}

export const WelcomeEmailTemplate: React.FC<Readonly<EmailTemplateProps>> = ({
  firstName,
  email,
}) => (
  <div
    style={{
      fontFamily: '"Inter", "Segoe UI", -apple-system, sans-serif',
      lineHeight: '1.6',
      color: '#1a1a1a',
      maxWidth: '650px',
      margin: '0 auto',
      padding: '0',
      backgroundColor: '#f8fafc',
    }}
  >
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        margin: '20px',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '50px 40px',
          textAlign: 'center',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '50%',
            width: '80px',
            height: '80px',
            margin: '0 auto 25px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
          }}
        >
          🎮
        </div>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '800',
            margin: '0 0 8px 0',
            letterSpacing: '-1px',
          }}
        >
          XTSkins
        </h1>
        <p
          style={{
            fontSize: '18px',
            margin: '0',
            opacity: '0.9',
            fontWeight: '300',
          }}
        >
          Sua loja de skins CS2 favorita
        </p>
      </div>

      <div style={{ padding: '50px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2
            style={{
              fontSize: '28px',
              fontWeight: '700',
              margin: '0 0 16px 0',
              color: '#1a1a1a',
              letterSpacing: '-0.5px',
            }}
          >
            Bem-vindo(a), {firstName}! 🎉
          </h2>
          <p
            style={{
              fontSize: '18px',
              color: '#64748b',
              margin: '0',
              lineHeight: '1.6',
              maxWidth: '400px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            Estamos muito felizes em ter você conosco! Prepare-se para uma
            experiência incrível.
          </p>
        </div>

        <div style={{ marginBottom: '40px' }}>
          <h3
            style={{
              fontSize: '22px',
              fontWeight: '700',
              margin: '0 0 30px 0',
              textAlign: 'center',
              color: '#1a1a1a',
            }}
          >
            O que você pode fazer agora:
          </h3>

          <div style={{ display: 'grid', gap: '16px' }}>
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: '#3b82f6',
                  borderRadius: '10px',
                  width: '48px',
                  height: '48px',
                  marginRight: '16px',
                  fontSize: '20px',
                  textAlign: 'center',
                  lineHeight: '48px',
                  verticalAlign: 'middle',
                }}
              >
                🛒
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    color: '#1a1a1a',
                  }}
                >
                  Explore nossa coleção
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0',
                  }}
                >
                  Milhares de skins exclusivas e raras
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: '#8b5cf6',
                  borderRadius: '10px',
                  width: '48px',
                  height: '48px',
                  marginRight: '16px',
                  fontSize: '20px',
                  textAlign: 'center',
                  lineHeight: '48px',
                  verticalAlign: 'middle',
                }}
              >
                💎
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    color: '#1a1a1a',
                  }}
                >
                  Skins premium
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0',
                  }}
                >
                  As melhores skins com preços incríveis
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: '#06d6a0',
                  borderRadius: '10px',
                  width: '48px',
                  height: '48px',
                  marginRight: '16px',
                  fontSize: '20px',
                  textAlign: 'center',
                  lineHeight: '48px',
                  verticalAlign: 'middle',
                }}
              >
                🚀
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    color: '#1a1a1a',
                  }}
                >
                  Ofertas exclusivas
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0',
                  }}
                >
                  Promoções especiais para membros
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  backgroundColor: '#f59e0b',
                  borderRadius: '10px',
                  width: '48px',
                  height: '48px',
                  marginRight: '16px',
                  fontSize: '20px',
                  textAlign: 'center',
                  lineHeight: '48px',
                  verticalAlign: 'middle',
                }}
              >
                🔒
              </div>
              <div>
                <h4
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 4px 0',
                    color: '#1a1a1a',
                  }}
                >
                  100% seguro
                </h4>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#64748b',
                    margin: '0',
                  }}
                >
                  Transações protegidas e confiáveis
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <a
            href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://xtskins.com'}`}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#ffffff',
              padding: '16px 40px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontSize: '18px',
              fontWeight: '600',
              display: 'inline-block',
              boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px',
            }}
          >
            Começar a Explorar 🛍️
          </a>
          <p
            style={{
              fontSize: '14px',
              color: '#94a3b8',
              margin: '12px 0 0 0',
            }}
          >
            Clique acima para acessar sua conta
          </p>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%)',
            border: '1px solid #b3d7c2',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: '#28a745',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              margin: '0 auto 16px',
              color: '#ffffff',
              fontSize: '18px',
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: '40px',
              verticalAlign: 'middle',
            }}
          >
            ✓
          </div>
          <h4
            style={{
              color: '#155724',
              fontSize: '18px',
              fontWeight: '700',
              margin: '0 0 8px 0',
            }}
          >
            Conta criada com sucesso!
          </h4>
          <p
            style={{
              color: '#155724',
              fontSize: '14px',
              margin: '0',
              opacity: '0.8',
            }}
          >
            <strong>Email:</strong> {email}
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#f8fafc',
          padding: '30px 40px',
          textAlign: 'center',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        <p
          style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            color: '#64748b',
          }}
        >
          Precisa de ajuda? Entre em contato conosco a qualquer momento.
        </p>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '16px',
            color: '#3b82f6',
            fontWeight: '600',
          }}
        >
          Equipe XTSkins 💜
        </p>
        <p
          style={{
            margin: '0',
            fontSize: '12px',
            color: '#94a3b8',
          }}
        >
          © {new Date().getFullYear()} XTSkins. Todos os direitos reservados.
        </p>
      </div>
    </div>
    <div style={{ height: '20px' }} />
  </div>
)
