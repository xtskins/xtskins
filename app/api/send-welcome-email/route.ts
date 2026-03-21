import { WelcomeEmailTemplate } from '@/components/email-template'
import { Resend } from 'resend'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { headers } = request
    const authorization = headers.get('authorization')

    if (!authorization) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authorization.replace('Bearer ', '')

    const supabase = createServerSupabaseClient(token)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, email, isNewUser } = body

    if (!firstName || !email) {
      return Response.json(
        { error: 'firstName e email são obrigatórios' },
        { status: 400 },
      )
    }

    if (!isNewUser) {
      return Response.json(
        { message: 'Email não enviado - usuário já existente' },
        { status: 200 },
      )
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY não está configurada')
      return Response.json(
        { error: 'Configuração de email não encontrada' },
        { status: 500 },
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'XTSkins <onboarding@resend.dev>',
      to: [email],
      subject: '🎮 Bem-vindo(a) à XTSkins!',
      react: WelcomeEmailTemplate({ firstName, email }) as React.ReactElement,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return Response.json({ error: 'Erro ao enviar email' }, { status: 500 })
    }

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({ welcome_email_sent: true })
        .eq('id', user.id)

      if (updateError) {
        console.error('Erro ao atualizar flag de email enviado:', updateError)
      } else {
        console.log(
          'Flag welcome_email_sent atualizada com sucesso para o usuário:',
          user.id,
        )
      }
    } catch (updateError) {
      console.error('Erro ao atualizar flag de email enviado:', updateError)
    }

    console.log('Email enviado com sucesso:', data)
    return Response.json({
      message: 'Email de boas-vindas enviado com sucesso',
      data,
    })
  } catch (error) {
    console.error('Erro na API de envio de email:', error)
    return Response.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
