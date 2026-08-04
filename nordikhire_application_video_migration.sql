-- Vídeo de apresentação opcional, submetido pelo candidato ao candidatar-se
-- a uma vaga específica (não é um vídeo de perfil global — é por candidatura,
-- para poder ser adaptado à posição).
alter table applications add column if not exists video_url text;
