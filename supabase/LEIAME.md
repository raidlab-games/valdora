# Valdora online: como ligar o servidor (Supabase)

Enquanto `js/net_config.js` estiver vazio, o jogo roda em **modo de teste**: contas e personagens ficam só no navegador.
Para valer para todo mundo (você e seus amigos, de qualquer computador), crie o banco online uma vez:

1. Entre em https://supabase.com e crie uma conta (é grátis) e um projeto novo (região: São Paulo).
2. No projeto, abra **SQL Editor → New query**, cole o arquivo `supabase/schema.sql` inteiro e clique em **Run**.
3. Em **Authentication → URL Configuration**, coloque em *Site URL*: `https://raidlab-games.github.io/valdora/`
   e adicione a mesma em *Redirect URLs* (é para onde o link de confirmação de e-mail e o de nova senha levam).
4. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**.
5. Mande as duas para o Claude (ou cole em `js/net_config.js`) e publique.

A chave *anon* é pública por natureza (vai no navegador de todo jogador). Quem protege os dados são as regras (RLS) do
`schema.sql`: cada jogador só lê e muda os próprios personagens. **Nunca** coloque a chave *service_role* no jogo.

## O que fica onde
- **Conta:** usuário (único), e-mail e senha. O Supabase guarda a senha com hash e manda o e-mail de confirmação e o de
  "esqueci minha senha". Dá para entrar com o usuário ou com o e-mail.
- **Servidores:** tabela `servers` (Lumeira, Escarpa, Degelo). Para abrir outro, inserir uma linha; `status` pode ser
  `online`, `maintenance` (aparece em manutenção) ou `closed`.
- **Personagens:** até 4 por servidor em cada conta, nome único dentro do servidor; o progresso inteiro vai no campo `data`.
  O jogo salva no servidor a cada 20 s durante o jogo e na hora ao voltar ao menu ou fechar a aba.
