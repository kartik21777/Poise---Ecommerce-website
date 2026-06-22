
const refunds = [
  {
    "refundId": "REF-1782109717676-NZBXR",
    "order": "6a36a5a582648fc60e6d5996",
    "paymentTransaction": "6a38d5928ef5e5212657be5e",
    "amount": 115.97,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Wrong item received",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_7aj3ra",
    "gatewayRefundAmount": 115.97,
    "createdAt": "2026-02-08T21:45:12.998Z",
    "updatedAt": "2026-02-08T21:45:12.998Z"
  },
  {
    "refundId": "REF-1782109717676-YOCIZN",
    "order": "6a36a5a582648fc60e6d5e74",
    "paymentTransaction": "6a38d5928ef5e5212657befc",
    "amount": 498.27,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_2ldn0s",
    "gatewayRefundAmount": 498.27,
    "createdAt": "2025-07-08T17:21:17.639Z",
    "updatedAt": "2025-07-08T17:21:17.639Z"
  },
  {
    "refundId": "REF-1782109717676-Y6GPWP",
    "order": "6a36a5a582648fc60e6d5802",
    "paymentTransaction": "6a38d5928ef5e5212657be28",
    "amount": 667.65,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_jbuci",
    "gatewayRefundAmount": 667.65,
    "createdAt": "2026-01-03T07:11:28.494Z",
    "updatedAt": "2026-01-03T07:11:28.494Z"
  },
  {
    "refundId": "REF-1782109717676-JODCJ",
    "order": "6a36a5a582648fc60e6d59be",
    "paymentTransaction": "6a38d5928ef5e5212657be65",
    "amount": 1187.8999999999999,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Wrong item received",
    "status": "REQUESTED",
    "gatewayRefundId": "ref_gateway_h6gsck",
    "gatewayRefundAmount": 0,
    "createdAt": "2025-07-26T18:38:06.865Z",
    "updatedAt": "2025-07-26T18:38:06.865Z"
  },
  {
    "refundId": "REF-1782109717676-IROVPD",
    "order": "6a36a5a582648fc60e6d59b1",
    "paymentTransaction": "6a38d5928ef5e5212657be64",
    "amount": 948.6300000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_rm9sn1",
    "gatewayRefundAmount": 948.6300000000001,
    "createdAt": "2026-05-27T10:57:17.225Z",
    "updatedAt": "2026-05-27T10:57:17.225Z"
  },
  {
    "refundId": "REF-1782109717676-I9TW6D",
    "order": "6a36a5a582648fc60e6d5aa9",
    "paymentTransaction": "6a38d5928ef5e5212657be86",
    "amount": 2639.9700000000003,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Fraudulent transaction",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_7809lk",
    "gatewayRefundAmount": 2639.9700000000003,
    "createdAt": "2026-01-21T09:44:24.828Z",
    "updatedAt": "2026-01-21T09:44:24.828Z"
  },
  {
    "refundId": "REF-1782109717676-13TLG",
    "order": "6a36a5a582648fc60e6d5b86",
    "paymentTransaction": "6a38d5928ef5e5212657bea2",
    "amount": 70.35,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_tr1ro",
    "gatewayRefundAmount": 70.35,
    "createdAt": "2025-09-19T09:19:39.918Z",
    "updatedAt": "2025-09-19T09:19:39.918Z"
  },
  {
    "refundId": "REF-1782109717676-P7PHK",
    "order": "6a36a5a582648fc60e6d572a",
    "paymentTransaction": "6a38d5928ef5e5212657be0c",
    "amount": 1081.91,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_ygygn8",
    "gatewayRefundAmount": 1081.91,
    "createdAt": "2026-03-15T23:55:28.649Z",
    "updatedAt": "2026-03-15T23:55:28.649Z"
  },
  {
    "refundId": "REF-1782109717676-KPL0QE",
    "order": "6a36a5a582648fc60e6d565c",
    "paymentTransaction": "6a38d5928ef5e5212657bdf1",
    "amount": 500.95,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_458r",
    "gatewayRefundAmount": 500.95,
    "createdAt": "2025-09-20T22:09:25.493Z",
    "updatedAt": "2025-09-20T22:09:25.493Z"
  },
  {
    "refundId": "REF-1782109717676-YR0OWS",
    "order": "6a36a5a582648fc60e6d5b8d",
    "paymentTransaction": "6a38d5928ef5e5212657bea4",
    "amount": 822.13,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Inventory issue",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_irxrlf",
    "gatewayRefundAmount": 822.13,
    "createdAt": "2025-12-21T16:37:50.415Z",
    "updatedAt": "2025-12-21T16:37:50.415Z"
  },
  {
    "refundId": "REF-1782109717676-ZZZM7C",
    "order": "6a36a5a582648fc60e6d5630",
    "paymentTransaction": "6a38d5928ef5e5212657bdec",
    "amount": 4900.419999999999,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_u71pz8",
    "gatewayRefundAmount": 4900.419999999999,
    "createdAt": "2025-07-14T08:02:52.154Z",
    "updatedAt": "2025-07-14T08:02:52.154Z"
  },
  {
    "refundId": "REF-1782109717676-7SBLBII",
    "order": "6a36a5a582648fc60e6d55a1",
    "paymentTransaction": "6a38d5928ef5e5212657bdda",
    "amount": 869.61,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Inventory issue",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_7k4zag",
    "gatewayRefundAmount": 869.61,
    "createdAt": "2026-03-25T05:24:29.115Z",
    "updatedAt": "2026-03-25T05:24:29.115Z"
  },
  {
    "refundId": "REF-1782109717676-YYCVO",
    "order": "6a36a5a582648fc60e6d559b",
    "paymentTransaction": "6a38d5928ef5e5212657bdd9",
    "amount": 3959.96,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_1zw5e5",
    "gatewayRefundAmount": 3959.96,
    "createdAt": "2025-12-30T02:04:50.488Z",
    "updatedAt": "2025-12-30T02:04:50.488Z"
  },
  {
    "refundId": "REF-1782109717676-5OBWS",
    "order": "6a36a5a582648fc60e6d58d2",
    "paymentTransaction": "6a38d5928ef5e5212657be45",
    "amount": 636.4100000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_yqxua5f",
    "gatewayRefundAmount": 636.4100000000001,
    "createdAt": "2026-04-04T07:59:55.492Z",
    "updatedAt": "2026-04-04T07:59:55.492Z"
  },
  {
    "refundId": "REF-1782109717676-63SFHT",
    "order": "6a36a5a582648fc60e6d5a5c",
    "paymentTransaction": "6a38d5928ef5e5212657be7a",
    "amount": 1017.9200000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_mkhxmm",
    "gatewayRefundAmount": 1017.9200000000001,
    "createdAt": "2025-08-15T05:20:20.479Z",
    "updatedAt": "2025-08-15T05:20:20.479Z"
  },
  {
    "refundId": "REF-1782109717676-VB9NC",
    "order": "6a36a5a582648fc60e6d5a50",
    "paymentTransaction": "6a38d5928ef5e5212657be78",
    "amount": 852.9000000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_96dyx",
    "gatewayRefundAmount": 852.9000000000001,
    "createdAt": "2026-07-03T15:34:40.740Z",
    "updatedAt": "2026-07-03T15:34:40.740Z"
  },
  {
    "refundId": "REF-1782109717676-I12SL",
    "order": "6a36a5a582648fc60e6d5a63",
    "paymentTransaction": "6a38d5928ef5e5212657be7b",
    "amount": 2342.9300000000003,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_my65c9",
    "gatewayRefundAmount": 2342.9300000000003,
    "createdAt": "2025-08-26T02:34:46.573Z",
    "updatedAt": "2025-08-26T02:34:46.573Z"
  },
  {
    "refundId": "REF-1782109717676-G693CT",
    "order": "6a36a5a582648fc60e6d56cb",
    "paymentTransaction": "6a38d5928ef5e5212657be00",
    "amount": 4036.9500000000003,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Product defective",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_2rszwa",
    "gatewayRefundAmount": 4036.9500000000003,
    "createdAt": "2025-09-27T01:29:10.169Z",
    "updatedAt": "2025-09-27T01:29:10.169Z"
  },
  {
    "refundId": "REF-1782109717676-9DG9J",
    "order": "6a36a5a582648fc60e6d560f",
    "paymentTransaction": "6a38d5928ef5e5212657bde9",
    "amount": 1616.91,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Late delivery",
    "status": "REQUESTED",
    "gatewayRefundId": "ref_gateway_vhpql5",
    "gatewayRefundAmount": 0,
    "createdAt": "2025-08-01T11:56:39.797Z",
    "updatedAt": "2025-08-01T11:56:39.797Z"
  },
  {
    "refundId": "REF-1782109717676-OCEJ7",
    "order": "6a36a5a582648fc60e6d5590",
    "paymentTransaction": "6a38d5928ef5e5212657bdd7",
    "amount": 4729.96,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_v136j",
    "gatewayRefundAmount": 4729.96,
    "createdAt": "2025-09-19T18:24:20.349Z",
    "updatedAt": "2025-09-19T18:24:20.349Z"
  },
  {
    "refundId": "REF-1782109717676-YMS3B2",
    "order": "6a36a5a682648fc60e6d6002",
    "paymentTransaction": "6a38d5928ef5e5212657bf2e",
    "amount": 575,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Product defective",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_x9qtno",
    "gatewayRefundAmount": 575,
    "createdAt": "2026-04-10T06:10:34.104Z",
    "updatedAt": "2026-04-10T06:10:34.104Z"
  },
  {
    "refundId": "REF-1782109717676-RC7NAE",
    "order": "6a36a5a682648fc60e6d636a",
    "paymentTransaction": "6a38d5928ef5e5212657bfa5",
    "amount": 3189.88,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Late delivery",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_nswj7p",
    "gatewayRefundAmount": 3189.88,
    "createdAt": "2026-04-30T11:22:53.461Z",
    "updatedAt": "2026-04-30T11:22:53.461Z"
  },
  {
    "refundId": "REF-1782109717676-BAGVP9",
    "order": "6a36a5a682648fc60e6d5f26",
    "paymentTransaction": "6a38d5928ef5e5212657bf13",
    "amount": 3723.3900000000003,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Late delivery",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_1t0xp",
    "gatewayRefundAmount": 3723.3900000000003,
    "createdAt": "2025-11-28T11:04:13.183Z",
    "updatedAt": "2025-11-28T11:04:13.183Z"
  },
  {
    "refundId": "REF-1782109717676-YX6OLE",
    "order": "6a36a5a582648fc60e6d59f7",
    "paymentTransaction": "6a38d5928ef5e5212657be6b",
    "amount": 22.65,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_cvsfyo",
    "gatewayRefundAmount": 22.65,
    "createdAt": "2025-10-23T03:25:25.052Z",
    "updatedAt": "2025-10-23T03:25:25.052Z"
  },
  {
    "refundId": "REF-1782109717677-4IT39V",
    "order": "6a36a5a582648fc60e6d57b7",
    "paymentTransaction": "6a38d5928ef5e5212657be20",
    "amount": 226.33,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_5dvpxr",
    "gatewayRefundAmount": 226.33,
    "createdAt": "2026-02-03T21:50:27.865Z",
    "updatedAt": "2026-02-03T21:50:27.865Z"
  },
  {
    "refundId": "REF-1782109717677-J16V7C",
    "order": "6a36a5a682648fc60e6d5f9c",
    "paymentTransaction": "6a38d5928ef5e5212657bf20",
    "amount": 657.1100000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Inventory issue",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_fnvky",
    "gatewayRefundAmount": 657.1100000000001,
    "createdAt": "2025-07-30T06:10:58.131Z",
    "updatedAt": "2025-07-30T06:10:58.131Z"
  },
  {
    "refundId": "REF-1782109717677-R3WLZO",
    "order": "6a36a5a582648fc60e6d5ef4",
    "paymentTransaction": "6a38d5928ef5e5212657bf0b",
    "amount": 1352.9,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Fraudulent transaction",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_j7arv",
    "gatewayRefundAmount": 1352.9,
    "createdAt": "2026-01-01T16:05:57.145Z",
    "updatedAt": "2026-01-01T16:05:57.145Z"
  },
  {
    "refundId": "REF-1782109717677-WG4JPA",
    "order": "6a36a5a582648fc60e6d5edf",
    "paymentTransaction": "6a38d5928ef5e5212657bf08",
    "amount": 4454.93,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Product defective",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_tl4ac",
    "gatewayRefundAmount": 4454.93,
    "createdAt": "2025-10-30T11:34:52.239Z",
    "updatedAt": "2025-10-30T11:34:52.239Z"
  },
  {
    "refundId": "REF-1782109717677-CZHR6",
    "order": "6a36a5a682648fc60e6d602b",
    "paymentTransaction": "6a38d5928ef5e5212657bf33",
    "amount": 2023.98,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_wx9ki9",
    "gatewayRefundAmount": 2023.98,
    "createdAt": "2026-01-15T16:58:17.550Z",
    "updatedAt": "2026-01-15T16:58:17.550Z"
  },
  {
    "refundId": "REF-1782109717677-PRDA7I",
    "order": "6a36a5a582648fc60e6d5852",
    "paymentTransaction": "6a38d5928ef5e5212657be34",
    "amount": 8.17,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_jdfqmp",
    "gatewayRefundAmount": 8.17,
    "createdAt": "2026-01-27T17:05:07.933Z",
    "updatedAt": "2026-01-27T17:05:07.933Z"
  },
  {
    "refundId": "REF-1782109717677-EN0XXF",
    "order": "6a36a5a582648fc60e6d5c6b",
    "paymentTransaction": "6a38d5928ef5e5212657bec0",
    "amount": 224.46,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_nvup6n",
    "gatewayRefundAmount": 224.46,
    "createdAt": "2025-12-01T15:14:35.154Z",
    "updatedAt": "2025-12-01T15:14:35.154Z"
  },
  {
    "refundId": "REF-1782109717677-K76E1E",
    "order": "6a36a5a682648fc60e6d5ff2",
    "paymentTransaction": "6a38d5928ef5e5212657bf2c",
    "amount": 64.18,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Late delivery",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_44qbmh",
    "gatewayRefundAmount": 64.18,
    "createdAt": "2026-05-12T10:57:36.555Z",
    "updatedAt": "2026-05-12T10:57:36.555Z"
  },
  {
    "refundId": "REF-1782109717677-EJYNMC",
    "order": "6a36a5a582648fc60e6d5797",
    "paymentTransaction": "6a38d5928ef5e5212657be1c",
    "amount": 1693.91,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Duplicate order",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_ivtuee",
    "gatewayRefundAmount": 1693.91,
    "createdAt": "2026-05-29T02:57:34.921Z",
    "updatedAt": "2026-05-29T02:57:34.921Z"
  },
  {
    "refundId": "REF-1782109717677-UXY2SF",
    "order": "6a36a5a682648fc60e6d5fca",
    "paymentTransaction": "6a38d5928ef5e5212657bf26",
    "amount": 148.99,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Product defective",
    "status": "REQUESTED",
    "gatewayRefundId": "ref_gateway_2cmmfi",
    "gatewayRefundAmount": 0,
    "createdAt": "2025-12-28T11:16:53.010Z",
    "updatedAt": "2025-12-28T11:16:53.010Z"
  },
  {
    "refundId": "REF-1782109717677-RHQJL5",
    "order": "6a36a5a582648fc60e6d5a3e",
    "paymentTransaction": "6a38d5928ef5e5212657be74",
    "amount": 731.9100000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_b29gr8",
    "gatewayRefundAmount": 731.9100000000001,
    "createdAt": "2025-12-07T12:41:56.318Z",
    "updatedAt": "2025-12-07T12:41:56.318Z"
  },
  {
    "refundId": "REF-1782109717677-VYF8UQ",
    "order": "6a36a5a582648fc60e6d5ab8",
    "paymentTransaction": "6a38d5928ef5e5212657be88",
    "amount": 98.37,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_6fpplv",
    "gatewayRefundAmount": 98.37,
    "createdAt": "2025-11-25T02:30:26.132Z",
    "updatedAt": "2025-11-25T02:30:26.132Z"
  },
  {
    "refundId": "REF-1782109717677-AHFDY",
    "order": "6a36a5a582648fc60e6d5a11",
    "paymentTransaction": "6a38d5928ef5e5212657be6e",
    "amount": 874.9300000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "REQUESTED",
    "gatewayRefundId": "ref_gateway_y7a969",
    "gatewayRefundAmount": 0,
    "createdAt": "2025-09-03T06:42:04.377Z",
    "updatedAt": "2025-09-03T06:42:04.377Z"
  },
  {
    "refundId": "REF-1782109717677-5F4I6H",
    "order": "6a36a5a682648fc60e6d5f8a",
    "paymentTransaction": "6a38d5928ef5e5212657bf1e",
    "amount": 2133.9300000000003,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_ysaq09",
    "gatewayRefundAmount": 2133.9300000000003,
    "createdAt": "2026-03-16T02:25:54.844Z",
    "updatedAt": "2026-03-16T02:25:54.844Z"
  },
  {
    "refundId": "REF-1782109717677-DJRVA9",
    "order": "6a36a5a582648fc60e6d569c",
    "paymentTransaction": "6a38d5928ef5e5212657bdf9",
    "amount": 121.19,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Wrong item received",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_md9yqj",
    "gatewayRefundAmount": 121.19,
    "createdAt": "2026-05-15T21:33:31.858Z",
    "updatedAt": "2026-05-15T21:33:31.858Z"
  },
  {
    "refundId": "REF-1782109717677-4NJ40A",
    "order": "6a36a5a582648fc60e6d5caf",
    "paymentTransaction": "6a38d5928ef5e5212657bec7",
    "amount": 1008.0000000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Late delivery",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_x7s7xo",
    "gatewayRefundAmount": 1008.0000000000001,
    "createdAt": "2026-07-09T05:46:09.456Z",
    "updatedAt": "2026-07-09T05:46:09.456Z"
  },
  {
    "refundId": "REF-1782109717677-7N3TFI",
    "order": "6a36a5a682648fc60e6d5f64",
    "paymentTransaction": "6a38d5928ef5e5212657bf19",
    "amount": 1398.81,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "REQUESTED",
    "gatewayRefundId": "ref_gateway_x5df8j",
    "gatewayRefundAmount": 0,
    "createdAt": "2026-03-11T07:04:03.355Z",
    "updatedAt": "2026-03-11T07:04:03.355Z"
  },
  {
    "refundId": "REF-1782109717677-A3AC7O",
    "order": "6a36a5a582648fc60e6d570a",
    "paymentTransaction": "6a38d5928ef5e5212657be08",
    "amount": 478.93,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_h7syii",
    "gatewayRefundAmount": 478.93,
    "createdAt": "2025-10-23T12:01:20.341Z",
    "updatedAt": "2025-10-23T12:01:20.341Z"
  },
  {
    "refundId": "REF-1782109717677-PQVV56",
    "order": "6a36a5a682648fc60e6d5fec",
    "paymentTransaction": "6a38d5928ef5e5212657bf2b",
    "amount": 244.32,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_c249r4",
    "gatewayRefundAmount": 244.32,
    "createdAt": "2025-09-30T02:25:33.315Z",
    "updatedAt": "2025-09-30T02:25:33.315Z"
  },
  {
    "refundId": "REF-1782109717677-M73Q4",
    "order": "6a36a5a682648fc60e6d60de",
    "paymentTransaction": "6a38d5928ef5e5212657bf4d",
    "amount": 1633.48,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Product defective",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_7b076p",
    "gatewayRefundAmount": 1633.48,
    "createdAt": "2026-02-27T12:48:20.505Z",
    "updatedAt": "2026-02-27T12:48:20.505Z"
  },
  {
    "refundId": "REF-1782109717677-X1V76U",
    "order": "6a36a5a682648fc60e6d60d9",
    "paymentTransaction": "6a38d5928ef5e5212657bf4c",
    "amount": 189.69,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_hzzi7",
    "gatewayRefundAmount": 189.69,
    "createdAt": "2025-08-15T13:28:58.124Z",
    "updatedAt": "2025-08-15T13:28:58.124Z"
  },
  {
    "refundId": "REF-1782109717677-PGGSE",
    "order": "6a36a5a582648fc60e6d56a1",
    "paymentTransaction": "6a38d5928ef5e5212657bdfa",
    "amount": 543.48,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_pvdts9",
    "gatewayRefundAmount": 543.48,
    "createdAt": "2025-08-29T00:34:37.288Z",
    "updatedAt": "2025-08-29T00:34:37.288Z"
  },
  {
    "refundId": "REF-1782109717677-7NUNDGN",
    "order": "6a36a5a682648fc60e6d6032",
    "paymentTransaction": "6a38d5928ef5e5212657bf35",
    "amount": 159.98000000000002,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_tgukal",
    "gatewayRefundAmount": 159.98000000000002,
    "createdAt": "2025-07-30T01:07:33.806Z",
    "updatedAt": "2025-07-30T01:07:33.806Z"
  },
  {
    "refundId": "REF-1782109717677-FZR3VK",
    "order": "6a36a5a682648fc60e6d5f23",
    "paymentTransaction": "6a38d5928ef5e5212657bf12",
    "amount": 126.98,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Wrong item received",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_of7pjq",
    "gatewayRefundAmount": 126.98,
    "createdAt": "2025-08-04T04:13:44.660Z",
    "updatedAt": "2025-08-04T04:13:44.660Z"
  },
  {
    "refundId": "REF-1782109717677-EM904H",
    "order": "6a36a5a682648fc60e6d6242",
    "paymentTransaction": "6a38d5928ef5e5212657bf85",
    "amount": 958.4800000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Duplicate order",
    "status": "FAILED",
    "gatewayRefundId": "ref_gateway_ne6apf",
    "gatewayRefundAmount": 0,
    "createdAt": "2026-01-31T19:02:07.873Z",
    "updatedAt": "2026-01-31T19:02:07.873Z"
  },
  {
    "refundId": "REF-1782109717677-IM0Y1",
    "order": "6a36a5a682648fc60e6d6171",
    "paymentTransaction": "6a38d5928ef5e5212657bf65",
    "amount": 455.85,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_12z02",
    "gatewayRefundAmount": 455.85,
    "createdAt": "2026-07-05T20:50:37.104Z",
    "updatedAt": "2026-07-05T20:50:37.104Z"
  },
  {
    "refundId": "REF-1782109717677-HVNY4O",
    "order": "6a36a5a582648fc60e6d5ad2",
    "paymentTransaction": "6a38d5928ef5e5212657be8d",
    "amount": 225.99,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Inventory issue",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_iw5yn",
    "gatewayRefundAmount": 225.99,
    "createdAt": "2026-03-19T21:09:26.315Z",
    "updatedAt": "2026-03-19T21:09:26.315Z"
  },
  {
    "refundId": "REF-1782109717677-6Z0NA",
    "order": "6a36a5a682648fc60e6d60cc",
    "paymentTransaction": "6a38d5928ef5e5212657bf4b",
    "amount": 140.94,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Wrong item received",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_5nzyul",
    "gatewayRefundAmount": 140.94,
    "createdAt": "2025-12-30T08:55:15.427Z",
    "updatedAt": "2025-12-30T08:55:15.427Z"
  },
  {
    "refundId": "REF-1782109717677-V9L5VP",
    "order": "6a36a5a582648fc60e6d5915",
    "paymentTransaction": "6a38d5928ef5e5212657be4e",
    "amount": 1154.89,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_k44udl",
    "gatewayRefundAmount": 1154.89,
    "createdAt": "2025-12-29T07:54:07.928Z",
    "updatedAt": "2025-12-29T07:54:07.928Z"
  },
  {
    "refundId": "REF-1782109717677-V94LGD",
    "order": "6a36a5a682648fc60e6d5fc1",
    "paymentTransaction": "6a38d5928ef5e5212657bf24",
    "amount": 93.99000000000001,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Customer changed mind",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_v25s7h",
    "gatewayRefundAmount": 93.99000000000001,
    "createdAt": "2025-08-22T04:46:01.475Z",
    "updatedAt": "2025-08-22T04:46:01.475Z"
  },
  {
    "refundId": "REF-1782109717677-2VTQ7K",
    "order": "6a36a5a582648fc60e6d5a77",
    "paymentTransaction": "6a38d5928ef5e5212657be7d",
    "amount": 102.39,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Late delivery",
    "status": "REQUESTED",
    "gatewayRefundId": "ref_gateway_w97rpp",
    "gatewayRefundAmount": 0,
    "createdAt": "2025-12-06T04:03:55.147Z",
    "updatedAt": "2025-12-06T04:03:55.147Z"
  },
  {
    "refundId": "REF-1782109717677-2Z6PU8",
    "order": "6a36a5a582648fc60e6d5b23",
    "paymentTransaction": "6a38d5928ef5e5212657be97",
    "amount": 412.90999999999997,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_pz691b",
    "gatewayRefundAmount": 412.90999999999997,
    "createdAt": "2026-04-23T21:10:51.637Z",
    "updatedAt": "2026-04-23T21:10:51.637Z"
  },
  {
    "refundId": "REF-1782109717677-TPZEJE",
    "order": "6a36a5a582648fc60e6d57d9",
    "paymentTransaction": "6a38d5928ef5e5212657be24",
    "amount": 1627.91,
    "currency": "USD",
    "exchangeRateUsed": 1,
    "reason": "Damaged item",
    "status": "COMPLETED",
    "gatewayRefundId": "ref_gateway_8bjoe",
    "gatewayRefundAmount": 1627.91,
    "createdAt": "2025-08-15T21:08:18.839Z",
    "updatedAt": "2025-08-15T21:08:18.839Z"
  }
];
db.refundtransactions.insertMany(refunds.map(r => ({
  ...r,
  order: ObjectId(r.order),
  paymentTransaction: ObjectId(r.paymentTransaction),
  createdAt: new Date(r.createdAt),
  updatedAt: new Date(r.updatedAt)
})));
console.log('Seeded ' + refunds.length + ' refund transactions successfully');

// Run order updates
db.orders.bulkWrite([
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5996"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d59b1"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5aa9"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5b86"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d565c"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5630"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d559b"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d58d2"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5a5c"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5a50"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5a63"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d56cb"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5590"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d636a"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d5f26"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d5f9c"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5ef4"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5edf"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d602b"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5797"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5a3e"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d5f8a"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5caf"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d570a"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d60de"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d60d9"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d6032"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d5f23"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5ad2"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5915"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a682648fc60e6d5fc1"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d5b23"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  },
  {
    "updateOne": {
      "filter": {
        "_id": "6a36a5a582648fc60e6d57d9"
      },
      "update": {
        "$set": {
          "status": "REFUNDED",
          "paymentStatus": "REFUNDED"
        }
      }
    }
  }
].map(u => ({
  updateOne: {
    filter: { _id: ObjectId(u.updateOne.filter._id) },
    update: u.updateOne.update
  }
})));
