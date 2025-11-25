--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-11-25 11:32:37

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
-- TOC entry 217 (class 1259 OID 57508)
-- Name: impresoras; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.impresoras (
    id integer NOT NULL,
    ip character varying(50) NOT NULL,
    sucursal character varying(100),
    modelo character varying(100),
    drivers_url text,
    tipo character varying(50),
    fecha_ultimo_cambio timestamp without time zone,
    cambios_toner integer DEFAULT 0,
    toner_reserva integer DEFAULT 0,
    toner_anterior integer DEFAULT 0,
    numero_serie text,
    contador_paginas integer,
    direccion text,
    telefono text,
    correo text,
    ultimo_pedido_contador integer,
    ultimo_pedido_fecha timestamp without time zone,
    ultima_alerta timestamp without time zone,
    estado character varying(20) DEFAULT 'verificando'::character varying,
    ultima_verificacion timestamp without time zone DEFAULT now()
);


ALTER TABLE public.impresoras OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 57516)
-- Name: impresoras_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.impresoras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.impresoras_id_seq OWNER TO postgres;

--
-- TOC entry 4832 (class 0 OID 0)
-- Dependencies: 218
-- Name: impresoras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.impresoras_id_seq OWNED BY public.impresoras.id;


--
-- TOC entry 219 (class 1259 OID 57517)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pedidos (
    id integer NOT NULL,
    solicitante character varying(255) NOT NULL,
    sucursal character varying(100) NOT NULL,
    modelo_impresora character varying(255) NOT NULL,
    tipo_toner character varying(50) NOT NULL,
    cantidad integer NOT NULL,
    fecha_pedido timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    CONSTRAINT pedidos_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('aprobado'::character varying)::text, ('rechazado'::character varying)::text])))
);


ALTER TABLE public.pedidos OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 57525)
-- Name: pedidos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pedidos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pedidos_id_seq OWNER TO postgres;

--
-- TOC entry 4833 (class 0 OID 0)
-- Dependencies: 220
-- Name: pedidos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pedidos_id_seq OWNED BY public.pedidos.id;


--
-- TOC entry 221 (class 1259 OID 57526)
-- Name: servidores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.servidores (
    id integer NOT NULL,
    ip character varying(15) NOT NULL,
    sucursal character varying(100) NOT NULL,
    nombre character varying(100),
    tipo character varying(50) DEFAULT 'servidor'::character varying,
    estado character varying(20) DEFAULT 'inactivo'::character varying,
    latencia character varying(20) DEFAULT '0ms'::character varying,
    ultima_verificacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.servidores OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 57535)
-- Name: servidores_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.servidores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.servidores_id_seq OWNER TO postgres;

--
-- TOC entry 4834 (class 0 OID 0)
-- Dependencies: 222
-- Name: servidores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.servidores_id_seq OWNED BY public.servidores.id;


--
-- TOC entry 4651 (class 2604 OID 57536)
-- Name: impresoras id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.impresoras ALTER COLUMN id SET DEFAULT nextval('public.impresoras_id_seq'::regclass);


--
-- TOC entry 4657 (class 2604 OID 57537)
-- Name: pedidos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN id SET DEFAULT nextval('public.pedidos_id_seq'::regclass);


--
-- TOC entry 4660 (class 2604 OID 57538)
-- Name: servidores id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servidores ALTER COLUMN id SET DEFAULT nextval('public.servidores_id_seq'::regclass);


--
-- TOC entry 4821 (class 0 OID 57508)
-- Dependencies: 217
-- Data for Name: impresoras; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.impresoras (id, ip, sucursal, modelo, drivers_url, tipo, fecha_ultimo_cambio, cambios_toner, toner_reserva, toner_anterior, numero_serie, contador_paginas, direccion, telefono, correo, ultimo_pedido_contador, ultimo_pedido_fecha, ultima_alerta, estado, ultima_verificacion) FROM stdin;
15	192.168.2.22	Encarnacion	P 501/502	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343272/V3100/z03653L16.exe	backup	\N	0	0	0	\N	\N	Direcci¢n no especificada	\N	\N	\N	\N	\N	desconectada	2025-11-25 11:26:15.368
64	192.168.4.21	Caaguazu	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	principal	2025-11-06 11:02:40.044551	6	1	50	5301XC46584	540427	RUTA 7 GASPAR R DE FRANCIA KM 180 - CAAGUAZU	\N	\N	\N	2025-11-05 08:08:45.05143	2025-11-05 07:52:31.558833	conectada	2025-11-25 11:26:15.418
31	192.168.7.21	Santani 	RICOHP P800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	principal	2025-11-21 17:48:43.387884	4	1	100	5301XC46541	320629	 RUTA ACCESO A SANTANI - 200 METROS DE LA ROTONDA	\N	\N	\N	2025-10-13 09:59:04.570701	2025-11-21 16:23:44.184476	conectada	2025-11-25 11:26:15.46
13	192.168.4.22	Caaguazu	P 501/502	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343272/V3100/z03653L16.exe	backup	2025-09-19 18:01:20.208966	3	0	90	5382P380086	26053	Direcci¢n no especificada	\N	\N	\N	2025-07-18 13:59:14.07954	2025-09-09 16:15:35.03084	conectada	2025-11-25 11:26:15.512
98	192.168.3.21	Ciudad del Este	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	principal	2025-11-11 10:13:22.388028	3	1	60	5302X453123	419048	Los Rosales esquina Padre Guillermo Bauman - CIUDAD DEL ESTE	\N	\N	\N	2025-11-05 08:09:00.561327	2025-11-11 07:53:46.388962	conectada	2025-11-25 11:26:16.523
16	192.168.46.22	Misiones	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	backup	2025-10-03 07:05:28.03573	1	1	20	5302XA59278	15403	4WCV+79W, San Ignacio 080316	\N	\N	\N	2025-10-10 14:12:14.914572	2025-11-21 10:03:36.181728	conectada	2025-11-25 11:26:16.566
6	192.168.8.23	Asuncion	IM 430	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343273/V3100/z03655L16.exe	comercial	2025-09-30 14:30:16.688765	3	1	60	3354P450006	58696	Direcci¢n no especificada	\N	\N	\N	2025-07-18 11:32:36.093232	2025-09-26 18:04:56.492059	conectada	2025-11-25 11:26:16.598
63	192.168.5.21	PJC	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	principal	2025-11-11 09:38:44.498237	5	1	70	5301XC46579	359403	Direcci¢n no especificada	\N	\N	\N	2025-11-05 08:09:56.166818	2025-11-07 16:22:31.133274	conectada	2025-11-25 11:26:17.593
11	192.168.7.22	Santani	P 501/502	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343272/V3100/z03653L16.exe	backup	2025-10-30 15:02:00.324328	4	1	90	5382P380185	38241	RUTA ACCESO A SANTANI - 200 METROS DE LA ROTONDA	\N	\N	\N	2025-07-24 08:48:02.566268	\N	conectada	2025-11-25 11:26:18.538
96	192.168.4.171	Caaguazu	HP LaserJet M203dw	https://support.hp.com/bo-es/drivers/hp-laserjet-pro-m203-printer-series/9365762	comercial	2025-10-21 15:41:51.748318	3	2	77	BRBSKCDK34	64092	Direcci¢n no especificada	\N	\N	\N	2025-07-24 10:09:04.771561	2025-09-09 16:15:35.464975	conectada	2025-11-25 11:26:18.593
99	192.168.2.157	Encarnacion	HP LaserJet P2055dn	https://support.hp.com/py-es/drivers/hp-laserjet-2055-printer-series/model/3662058	comercial	\N	0	1	-2	CNC1C18050	140117	Direcc	\N	\N	\N	\N	\N	conectada	2025-11-25 11:26:18.654
17	192.168.48.122	Concepcion	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	backup	2025-09-09 16:15:33.623444	3	0	70	5304X375768	29839	Direcci¢n no especificada	\N	\N	\N	\N	\N	conectada	2025-11-25 11:26:18.707
9	192.168.46.21	Misiones	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	principal	2025-10-01 09:55:17.217162	4	1	100	5302XA59354	209206	4WCV+79W, San Ignacio 080316	\N	\N	\N	2025-11-05 08:09:13.496069	2025-08-06 15:35:52.883965	desconectada	2025-11-25 11:26:21.372
65	192.168.5.8	PJC	HP MFP M127fn	https://support.hp.com/py-es/drivers/hp-laserjet-pro-mfp-m127fn/model/5303415	comercial	\N	0	2	0	\N	\N	Direcci¢n no especificada	\N	\N	\N	2025-11-20 07:55:06.76584	\N	conectada	2025-11-25 11:26:21.425
10	192.168.48.121	Concepcion	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	principal	2025-11-21 07:38:41.744382	6	3	100	5304X375774	211599	Mcal. Francisco Lopez, Gral Bernardino Caballero	\N	\N	\N	2025-07-18 11:34:51.200761	2025-11-20 07:58:49.107877	conectada	2025-11-25 11:26:21.479
5	192.168.2.21	Encarnacion	SP 8400DN	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343271/V3100/z03651L16.exe	principal	2025-09-09 16:15:35.062013	2	2	20	Y871RA10103	396684	RUTA 1 KM 6 1.5 CERCA DE LA ENTRADA BARRIO ITA P - ENCARNACION	\N	\N	\N	2025-11-13 09:20:22.971696	2025-11-25 11:03:24.034406	conectada	2025-11-25 11:26:11.724
7	192.168.8.20	Asuncion-color	P C600	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343154/V3200/z04340L16.exe	comercial	2025-09-09 16:15:35.071515	2	0	70	5321X720063	26831	Direcci¢n no especificada	\N	\N	\N	2025-07-18 11:32:36.087769	\N	conectada	2025-11-25 11:26:11.757
14	192.168.3.22	Ciudad del Este	RICOH P 800	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	backup	2025-09-09 16:15:33.68212	1	0	-2	5302X453119	93518	Direcci¢n no especificada	\N	\N	\N	\N	\N	conectada	2025-11-25 11:26:11.801
8	192.168.8.41	Asuncion-RRHH	P 501/502	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343272/V3100/z03653L16.exe	comercial	2025-09-22 14:37:36.487585	3	0	90	5385P402488	923	Direcci¢n no especificada	\N	\N	\N	2025-07-18 11:32:36.071002	2025-09-19 18:01:21.790712	conectada	2025-11-25 11:26:12.719
12	192.168.5.22	Pedro Juan Caballero	P 501/502	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343272/V3100/z03653L16.exe	backup	2025-09-09 16:15:35.046178	2	0	60	5382P380089	28129	Direcci¢n no especificada	\N	\N	\N	\N	\N	conectada	2025-11-25 11:26:12.768
66	192.168.48.8	Concepcion	HP M201dw	https://support.ricoh.com/bb/pub_e/dr_ut_e/0001343/0001343146/V3200/z04344L17.exe	comercial	2025-09-25 07:52:18.931053	4	0	48	BRBSH2JD55	107184	Mcal. Francisco Lopez, Gral Bernardino Caballero	\N	\N	\N	2025-07-23 16:12:23.411302	\N	conectada	2025-11-25 11:26:12.818
\.


--
-- TOC entry 4823 (class 0 OID 57517)
-- Dependencies: 219
-- Data for Name: pedidos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pedidos (id, solicitante, sucursal, modelo_impresora, tipo_toner, cantidad, fecha_pedido, estado) FROM stdin;
32	Federico Britez	CENT	HP LaserJet M111a	Blanco y negro	1	2025-11-21 17:12:21.803778	aprobado
30	Veronica Acuña 	ENC	HP LaserJet M111w	Blanco y negro	4	2025-11-20 17:05:32.983242	aprobado
29	Veronica Acuña 	ENC	HP LaserJet Pro MFP M201	Blanco y negro	4	2025-11-20 17:04:32.85418	aprobado
27	ESTHER MNIÑO	CDE	HP LaserJet P1102w	Blanco y negro	1	2025-11-20 08:07:28.718762	aprobado
26	ESTHER MNIÑO	CDE	HP LaserJet Pro MFP M135w	Blanco y negro	1	2025-11-20 08:07:02.384208	aprobado
\.


--
-- TOC entry 4825 (class 0 OID 57526)
-- Dependencies: 221
-- Data for Name: servidores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.servidores (id, ip, sucursal, nombre, tipo, estado, latencia, ultima_verificacion, created_at, updated_at) FROM stdin;
22	192.168.2.100	ENCARNACION	CAM ENC	CAM	activo	9ms	2025-11-25 11:23:03.645197	2025-11-21 09:49:03.885741	2025-11-21 09:49:03.885741
23	192.168.8.150	ASUNCION	NVR ASUNCION	NVR	activo	3ms	2025-11-25 11:23:03.674036	2025-11-21 09:49:45.307494	2025-11-21 09:49:45.307494
6	192.168.2.1	ENCARNACION	ENCARNACION	router	activo	9ms	2025-11-25 11:23:03.707094	2025-09-25 15:19:00.073	2025-11-24 17:13:33.526485
7	192.168.4.1	CAAGUAZU	CAAGUAZU	router	activo	10ms	2025-11-25 11:23:03.745172	2025-09-25 15:20:10.229709	2025-11-24 17:13:38.266638
8	192.168.5.1	PJC	PJC	router	activo	12ms	2025-11-25 11:23:03.7811	2025-09-25 15:21:08.199201	2025-11-24 17:13:42.649916
15	192.168.8.123	NUC	NUC	NUC	activo	2ms	2025-11-25 11:23:03.806364	2025-11-14 07:41:05.184001	2025-11-24 17:14:39.881006
13	192.168.46.1	MISIONES	MISIONES	Router	activo	7ms	2025-11-25 11:23:03.837247	2025-09-30 17:25:04.688695	2025-09-30 17:25:04.688695
9	192.168.7.1	SANTANI	SANTANI	router	activo	17ms	2025-11-25 11:23:03.877135	2025-09-25 15:22:09.650318	2025-11-24 17:50:53.015609
16	192.168.48.100	CONCEPCION	NVR CONCEPCION	NVR	activo	13ms	2025-11-25 11:23:03.914548	2025-11-21 08:12:32.357241	2025-11-21 08:12:32.357241
17	192.168.5.100	PJC	NVR PJC	NVR	activo	13ms	2025-11-25 11:23:03.952179	2025-11-21 08:13:30.502845	2025-11-21 08:13:30.502845
21	192.168.46.100	MISIONES	DVR MISIONES	DVR	activo	8ms	2025-11-25 11:23:03.983586	2025-11-21 09:48:29.503241	2025-11-21 09:48:29.503241
18	192.168.7.100	SANTANI	DBR SANTANI	DVR	activo	7ms	2025-11-25 11:23:04.014468	2025-11-21 08:14:28.247234	2025-11-21 08:14:28.247234
14	192.168.48.1	CONCEPCION	CONCEPCION	Router	activo	12ms	2025-11-25 11:23:04.048713	2025-09-30 17:26:27.149373	2025-09-30 17:26:27.149373
19	192.168.4.100	CAAGUAZU	NVR CAAG	NVR	activo	13ms	2025-11-25 11:23:04.08435	2025-11-21 09:47:33.38662	2025-11-21 09:47:33.38662
5	192.168.3.1	CDE	CDE	router	activo	8ms	2025-11-25 11:23:04.118089	2025-09-25 15:17:52.43676	2025-11-24 17:13:28.375718
4	192.168.8.1	ASUNCION	ASUNCION	router	activo	4ms	2025-11-25 11:23:04.146708	2025-09-25 15:04:40.509524	2025-11-24 17:13:24.45146
20	192.168.3.100	CDE	CAM CDE	CAM	activo	10ms	2025-11-25 11:23:04.181142	2025-11-21 09:48:07.385791	2025-11-21 09:48:07.385791
\.


--
-- TOC entry 4835 (class 0 OID 0)
-- Dependencies: 218
-- Name: impresoras_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.impresoras_id_seq', 100, true);


--
-- TOC entry 4836 (class 0 OID 0)
-- Dependencies: 220
-- Name: pedidos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pedidos_id_seq', 33, true);


--
-- TOC entry 4837 (class 0 OID 0)
-- Dependencies: 222
-- Name: servidores_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.servidores_id_seq', 24, true);


--
-- TOC entry 4669 (class 2606 OID 57540)
-- Name: impresoras impresoras_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.impresoras
    ADD CONSTRAINT impresoras_pkey PRIMARY KEY (id);


--
-- TOC entry 4671 (class 2606 OID 57542)
-- Name: pedidos pedidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pedidos_pkey PRIMARY KEY (id);


--
-- TOC entry 4673 (class 2606 OID 57544)
-- Name: servidores servidores_ip_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_ip_key UNIQUE (ip);


--
-- TOC entry 4675 (class 2606 OID 57546)
-- Name: servidores servidores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.servidores
    ADD CONSTRAINT servidores_pkey PRIMARY KEY (id);


-- Completed on 2025-11-25 11:32:37

--
-- PostgreSQL database dump complete
--

