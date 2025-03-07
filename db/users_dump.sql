--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Debian 17.2-1.pgdg120+1)
-- Dumped by pg_dump version 17.2 (Debian 17.2-1.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: users; Type: TABLE; Schema: public; Owner: root
--

CREATE TABLE public.users (
    id integer NOT NULL,
    login character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    has_premium boolean DEFAULT false,
    has2_f_a boolean DEFAULT false,
    is_blocked boolean DEFAULT false,
    notify boolean DEFAULT false,
    hour_notify time without time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO root;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: root
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO root;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: root
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: root
--

COPY public.users (id, login, email, password, has_premium, has2_f_a, is_blocked, notify, hour_notify, created_at, updated_at) FROM stdin;
1	SunnyDream22	brightday@example.com	$2b$10$Na8.7aO.fzV9ubgdH.xTkegpcplMxHF7S7KDr46..sIsgw/PB9Vy6	f	f	f	f	\N	2025-03-07 11:04:21.957+00	2025-03-07 11:04:21.957+00
2	TechNinja85	digital.shadow@example.net	$2b$10$jeibed9Qf2/.e40ctkAQzuaqZh4XSCwTdaxzpNaPS0P.7WeT9sghu	t	f	f	f	\N	2025-03-07 11:06:20.629+00	2025-03-07 11:06:20.629+00
3	MountainHiker	peak.explorer@example.org	$2b$10$PoutMupr.AJYZB02ohavh.XAmI7o6q314R2mc3DYgk6Zun0qALA6a	t	t	f	f	\N	2025-03-07 11:08:10.688+00	2025-03-07 11:08:10.688+00
4	OceanWave34	sea.breeze@example.com	$2b$10$cRAXDOzC2wEZ/NkQy1rR8OgQhn6Ndc9/0tiTGs3UgSFRiCep9DA2.	t	t	t	f	\N	2025-03-07 11:12:23.813+00	2025-03-07 11:12:23.813+00
5	BookWorm777	avid.reader@example.net	$2b$10$g106IErcqK3aVHKWoVMqX.li09DOvXHiwTtLTmuUyhku8NH8IsLjC	t	t	t	f	\N	2025-03-07 11:13:13.718+00	2025-03-07 11:13:13.718+00
6	StarGazer42	cosmic.view@example.org	$2b$10$RM/E//EYTF8iDl5dEDdGiu0FRmtENeb8aipaaWXp8amTnVmh4L1Wm	f	t	t	f	\N	2025-03-07 11:13:39.177+00	2025-03-07 11:13:39.177+00
7	PixelArtist	creative.pixels@example.com	$2b$10$FCLpw305OKcXCEXwC/Ow4e2H0cjEruLhPHC9rjYb3wUT7ac.IpTKi	f	t	f	f	\N	2025-03-07 11:14:32.821+00	2025-03-07 11:14:32.821+00
8	MusicMaestro	melody.maker@example.net	$2b$10$UgwjTy81VIxNJTBy1Y3WeujPnEbKjekH68GwG4PZU4OkqGAbl5lxy	f	f	f	f	\N	2025-03-07 11:15:12.543+00	2025-03-07 11:15:12.543+00
9	FitnessFanatic	health.journey@example.org	$2b$10$584ztXOa9QHkeDbmxJw0MuB.yDB/WadUT/l7SgRSVSdf4ZCo1dhc.	f	f	f	f	\N	2025-03-07 11:16:06.539+00	2025-03-07 11:16:06.539+00
10	CoffeeConnoisseur	brew.master@example.com	$2b$10$noQ98tcdSRxXHj8beMym.eOtNVNT7haiFdQS7vH6m/s8LfN8fclC2	f	f	t	f	\N	2025-03-07 11:16:57.241+00	2025-03-07 11:16:57.241+00
\.


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: root
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_login_key; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: root
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

