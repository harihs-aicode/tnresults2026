import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOTAL_SEATS = 234;
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const OFFICIAL_FEED_URL = `${API_BASE_URL}/api/tn-election-live`;
const COUNTING_STAGES = [
  {
    timestamp: "08:05",
    totalVotes: 1824500,
    reportingPercent: 11,
    turnoutPercent: 9.6,
    parties: {
      TVK: { votes: 781000, seats: 32, voteShare: 42.8, swing: 4.2 },
      "DMK Alliance": { votes: 548000, seats: 20, voteShare: 30.0, swing: -1.6 },
      "ADMK Alliance": { votes: 495500, seats: 14, voteShare: 27.2, swing: -2.1 },
    },
    battlegrounds: [
      { name: "Kolathur", leader: "DMK Alliance", margin: 5120, update: "Round 4 of 18" },
      { name: "Coimbatore South", leader: "TVK", margin: 2840, update: "Postal ballots added" },
      { name: "Edappadi", leader: "ADMK Alliance", margin: 4210, update: "Round 3 of 16" },
      { name: "Chepauk-Thiruvallikeni", leader: "DMK Alliance", margin: 8660, update: "Urban booths surge" },
    ],
  },
  {
    timestamp: "09:20",
    totalVotes: 4623200,
    reportingPercent: 28,
    turnoutPercent: 21.9,
    parties: {
      TVK: { votes: 1942000, seats: 84, voteShare: 42.0, swing: 4.4 },
      "DMK Alliance": { votes: 1416000, seats: 33, voteShare: 30.6, swing: -1.8 },
      "ADMK Alliance": { votes: 1265200, seats: 19, voteShare: 27.4, swing: -2.3 },
    },
    battlegrounds: [
      { name: "Kolathur", leader: "DMK Alliance", margin: 9260, update: "Round 8 of 18" },
      { name: "Coimbatore South", leader: "TVK", margin: 7110, update: "Strong urban consolidation" },
      { name: "Edappadi", leader: "ADMK Alliance", margin: 6050, update: "Western belt holding" },
      { name: "Tambaram", leader: "TVK", margin: 1980, update: "Too close to call" },
    ],
  },
  {
    timestamp: "10:45",
    totalVotes: 8128400,
    reportingPercent: 47,
    turnoutPercent: 37.5,
    parties: {
      TVK: { votes: 3397000, seats: 118, voteShare: 41.8, swing: 4.8 },
      "DMK Alliance": { votes: 2481000, seats: 46, voteShare: 30.5, swing: -2.0 },
      "ADMK Alliance": { votes: 2254400, seats: 33, voteShare: 27.7, swing: -2.8 },
    },
    battlegrounds: [
      { name: "Kolathur", leader: "DMK Alliance", margin: 12480, update: "Halfway through counting" },
      { name: "Coimbatore South", leader: "TVK", margin: 10320, update: "Industrial wards in" },
      { name: "Edappadi", leader: "ADMK Alliance", margin: 8510, update: "Round 10 of 16" },
      { name: "Madurai Central", leader: "DMK Alliance", margin: 1420, update: "Photo finish developing" },
    ],
  },
  {
    timestamp: "12:10",
    totalVotes: 12196400,
    reportingPercent: 63,
    turnoutPercent: 49.8,
    parties: {
      TVK: { votes: 5085000, seats: 136, voteShare: 41.7, swing: 5.1 },
      "DMK Alliance": { votes: 3734000, seats: 61, voteShare: 30.6, swing: -2.2 },
      "ADMK Alliance": { votes: 3387400, seats: 37, voteShare: 27.7, swing: -2.9 },
    },
    battlegrounds: [
      { name: "Kolathur", leader: "DMK Alliance", margin: 16140, update: "Lead widening" },
      { name: "Coimbatore South", leader: "TVK", margin: 12920, update: "Round 13 of 18" },
      { name: "Edappadi", leader: "ADMK Alliance", margin: 11050, update: "Comfortable lead" },
      { name: "Madurai Central", leader: "TVK", margin: 940, update: "Narrow advantage" },
    ],
  },
  {
    timestamp: "14:00",
    totalVotes: 16352800,
    reportingPercent: 81,
    turnoutPercent: 61.4,
    parties: {
      TVK: { votes: 6811000, seats: 148, voteShare: 41.6, swing: 5.4 },
      "DMK Alliance": { votes: 5008000, seats: 58, voteShare: 30.6, swing: -2.4 },
      "ADMK Alliance": { votes: 4533800, seats: 28, voteShare: 27.8, swing: -3.0 },
    },
    battlegrounds: [
      { name: "Kolathur", leader: "DMK Alliance", margin: 18800, update: "Final rounds approaching" },
      { name: "Coimbatore South", leader: "TVK", margin: 15440, update: "TVK consolidates" },
      { name: "Edappadi", leader: "ADMK Alliance", margin: 12360, update: "Lead stable" },
      { name: "Madurai Central", leader: "TVK", margin: 2010, update: "Late swing confirmed" },
    ],
  },
];

const PARTY_META = {
  TVK: {
    short: "TVK",
    color: "#f97316",
    glow: "rgba(249, 115, 22, 0.28)",
    accent: "#fdba74",
  },
  "DMK Alliance": {
    short: "DMK+",
    color: "#ef4444",
    glow: "rgba(239, 68, 68, 0.25)",
    accent: "#fca5a5",
  },
  "ADMK Alliance": {
    short: "ADMK+",
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.25)",
    accent: "#6ee7b7",
  },
};
const OTHER_PARTY_META = {
  short: "OTH",
  color: "#64748b",
  accent: "#e2e8f0",
};

const partyNames = Object.keys(PARTY_META);
const ALLIANCE_PARTY_MAP = {
  TVK: [
    "tamilagavettrikazhagam",
    "tvk",
  ],
  "DMK Alliance": [
    "dravidamunnetrakazhagam",
    "dmk",
    "indiannationalcongress",
    "inc",
    "communistpartyofindia",
    "cpi",
    "communistpartyofindia(marxist)",
    "cpim",
    "viduthalaichiruthaigalkatchi",
    "vck",
    "marumalarchidravidamunnetrakazhagam",
    "mdmk",
    "indianunionmuslimleague",
    "iuml",
    "manithaneyamakkalkatchi",
    "mmk",
    "kongunadumakkaldesiakatchi",
    "kmdk",
    "makkalneethimayyam",
    "mnm",
  ],
  "ADMK Alliance": [
    "allindiaanna",
    "anna",
    "aiadmk",
    "bharatiyajanataparty",
    "bjp",
    "pattalimakkalkatchi",
    "pmk",
    "amma",
    "ammk",
    "tamilmanilacongress",
    "tmc",
    "allindiaforwardbloc",
    "aifb",
  ],
};
const CONSTITUENCIES_BY_DISTRICT = {
  Thiruvallur: [
    "Gummidipoondi",
    "Ponneri",
    "Tiruttani",
    "Thiruvallur",
    "Poonamallee",
    "Avadi",
    "Maduravoyal",
    "Ambattur",
    "Madavaram",
  ],
  Chennai: [
    "Thiruvottiyur",
    "Dr. Radhakrishnan Nagar",
    "Perambur",
    "Kolathur",
    "Villivakkam",
    "Thiru-Vi-Ka Nagar",
    "Egmore",
    "Royapuram",
    "Harbour",
    "Chepauk-Thiruvallikeni",
    "Thousand Lights",
    "Anna Nagar",
    "Virugampakkam",
    "Saidapet",
    "Thiyagarayanagar",
    "Mylapore",
    "Velachery",
    "Sholinganallur",
    "Alandur",
  ],
  Chengalpattu: [
    "Pallavaram",
    "Tambaram",
    "Chengalpattu",
    "Thiruporur",
    "Cheyyur",
    "Madurantakam",
  ],
  Kancheepuram: ["Sriperumbudur", "Uthiramerur", "Kancheepuram"],
  Ranipet: ["Arakkonam", "Sholingur", "Ranipet", "Arcot"],
  Vellore: ["Katpadi", "Vellore", "Anaikattu", "Kilvaithinankuppam", "Gudiyatham"],
  Tirupattur: ["Vaniyambadi", "Ambur", "Jolarpet", "Tiruppattur"],
  Krishnagiri: ["Uthangarai", "Bargur", "Krishnagiri", "Veppanahalli", "Hosur", "Thalli"],
  Dharmapuri: ["Palacode", "Pennagaram", "Dharmapuri", "Pappireddippatti", "Harur"],
  Tiruvannamalai: [
    "Chengam",
    "Tiruvannamalai",
    "Kilpennathur",
    "Kalasapakkam",
    "Polur",
    "Arani",
    "Cheyyar",
    "Vandavasi",
  ],
  Villupuram: ["Gingee", "Mailam", "Tindivanam", "Vanur", "Villupuram", "Vikravandi"],
  Kallakurichi: ["Tirukkoyilur", "Ulundurpettai", "Rishivandiyam", "Sankarapuram", "Kallakurichi"],
  Salem: [
    "Gangavalli",
    "Attur",
    "Yercaud",
    "Omalur",
    "Mettur",
    "Edappadi",
    "Salem (West)",
    "Salem (North)",
    "Salem (South)",
    "Veerapandi",
  ],
  Namakkal: ["Sankari", "Rasipuram", "Senthamangalam", "Namakkal", "Paramathi Velur", "Tiruchengodu"],
  Erode: [
    "Kumarapalayam",
    "Erode (East)",
    "Erode (West)",
    "Modakkurichi",
    "Perundurai",
    "Bhavani",
    "Anthiyur",
    "Gobichettipalayam",
    "Bhavanisagar",
  ],
  Nilgiris: ["Udhagamandalam", "Gudalur", "Coonoor"],
  Coimbatore: [
    "Mettupalayam",
    "Sulur",
    "Kavundampalayam",
    "Coimbatore (North)",
    "Thondamuthur",
    "Coimbatore (South)",
    "Singanallur",
    "Kinathukadavu",
    "Pollachi",
    "Valparai",
  ],
  Tiruppur: ["Avanashi", "Tiruppur (North)", "Tiruppur (South)", "Palladam", "Dharapuram", "Kangayam", "Udumalaipettai", "Madathukulam"],
  Dindigul: ["Palani", "Oddanchatram", "Athoor", "Nilakottai", "Natham", "Dindigul", "Vedasandur"],
  Karur: ["Aravakurichi", "Karur", "Krishnarayapuram", "Kulithalai"],
  Tiruchirappalli: [
    "Manapaarai",
    "Srirangam",
    "Tiruchirappalli (West)",
    "Tiruchirappalli (East)",
    "Thiruverumbur",
    "Lalgudi",
    "Manachanallur",
    "Musiri",
    "Thuraiyur",
  ],
  Perambalur: ["Perambalur", "Kunnam"],
  Ariyalur: ["Ariyalur", "Jayankondam"],
  Cuddalore: ["Tittakudi", "Virudhachalam", "Neyveli", "Panruti", "Cuddalore", "Kurinjipadi", "Bhuvanagiri", "Chidambaram", "Kattumannarkoil"],
  Mayiladuthurai: ["Sirkazhi", "Mayiladuthurai", "Poompuhar"],
  Nagapattinam: ["Nagapattinam", "Kilvelur", "Vedaranyam"],
  Tiruvarur: ["Thiruthuraipoondi", "Mannargudi", "Thiruvarur", "Nannilam"],
  Thanjavur: ["Thiruvidaimarudur", "Kumbakonam", "Papanasam", "Thiruvaiyaru", "Thanjavur", "Orathanadu", "Pattukkottai", "Peravurani"],
  Pudukkottai: ["Gandarvakottai", "Viralimalai", "Pudukkottai", "Thirumayam", "Alangudi", "Aranthangi"],
  Sivaganga: ["Karaikudi", "Tiruppattur", "Sivaganga", "Manamadurai"],
  Madurai: [
    "Melur",
    "Madurai East",
    "Sholavandan",
    "Madurai North",
    "Madurai South",
    "Madurai Central",
    "Madurai West",
    "Thiruparankundram",
    "Thirumangalam",
    "Usilampatti",
  ],
  Theni: ["Andipatti", "Periyakulam", "Bodinayakanur", "Cumbum"],
  Virudhunagar: ["Rajapalayam", "Srivilliputhur", "Sattur", "Sivakasi", "Virudhunagar", "Aruppukkottai", "Tiruchuli"],
  Ramanathapuram: ["Paramakudi", "Tiruvadanai", "Ramanathapuram", "Mudhukulathur"],
  Thoothukudi: ["Vilathikulam", "Thoothukkudi", "Tiruchendur", "Srivaikuntam", "Ottapidaram", "Kovilpatti"],
  Tenkasi: ["Sankarankovil", "Vasudevanallur", "Kadayanallur", "Tenkasi"],
  Tirunelveli: ["Alangulam", "Tirunelveli", "Ambasamudram", "Palayamkottai", "Nanguneri", "Radhapuram"],
  Kanniyakumari: ["Kanniyakumari", "Nagercoil", "Colachal", "Padmanabhapuram", "Vilavancode", "Killiyoor"],
};

const formatCompact = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: value > 999999 ? 1 : 0,
  }).format(value);

const formatNumber = (value) => new Intl.NumberFormat("en-IN").format(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const sumVotes = (seat, keys) => keys.reduce((total, key) => total + seat.votes[key], 0);
const normalizePartyName = (value) => (value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const districtNames = Object.keys(CONSTITUENCIES_BY_DISTRICT);
const constituencyDistrictMap = Object.entries(CONSTITUENCIES_BY_DISTRICT).reduce(
  (accumulator, [district, constituencies]) => {
    constituencies.forEach((constituency) => {
      accumulator[constituency.toLowerCase()] = district;
    });
    return accumulator;
  },
  {}
);

const getAllianceForParty = (partyName) => {
  const normalized = normalizePartyName(partyName);

  if (!normalized) {
    return null;
  }

  const matchedAlliance = partyNames.find((allianceName) =>
    ALLIANCE_PARTY_MAP[allianceName].some(
      (alias) => normalized === alias || normalized.includes(alias)
    )
  );

  return matchedAlliance || null;
};

const buildSeatRows = (stage, stageIndex) =>
  Object.entries(CONSTITUENCIES_BY_DISTRICT).map(([districtName, constituencies], districtIndex) => {
    const seats = constituencies.map((constituencyName, seatIndex) => {
      const countedPercent = clamp(
        stage.reportingPercent + 7 + ((districtIndex * 3 + seatIndex * 5) % 16),
        12,
        99
      );
      const totalVotes = 42000 + districtIndex * 1180 + seatIndex * 940 + stageIndex * 8600;
      const countedVotes = Math.round(totalVotes * (countedPercent / 100));
      const tvkBias = ((districtIndex * 13 + seatIndex * 7) % 9) - 4;
      const dmkBias = ((districtIndex * 11 + seatIndex * 5) % 9) - 4;
      const admkBias = ((districtIndex * 7 + seatIndex * 9) % 9) - 4;
      const weightMap = {
        TVK: Math.max(18, stage.parties.TVK.voteShare + tvkBias * 0.75),
        "DMK Alliance": Math.max(
          18,
          stage.parties["DMK Alliance"].voteShare + dmkBias * 0.75
        ),
        "ADMK Alliance": Math.max(
          18,
          stage.parties["ADMK Alliance"].voteShare + admkBias * 0.75
        ),
      };
      const totalWeight = partyNames.reduce((total, party) => total + weightMap[party], 0);
      const votes = partyNames.reduce((accumulator, party, index) => {
        if (index === partyNames.length - 1) {
          const assigned = Object.values(accumulator).reduce((sum, value) => sum + value, 0);
          return { ...accumulator, [party]: countedVotes - assigned };
        }

        return {
          ...accumulator,
          [party]: Math.round((countedVotes * weightMap[party]) / totalWeight),
        };
      }, {});
      const sortedParties = [...partyNames].sort((left, right) => votes[right] - votes[left]);
      const leader = sortedParties[0];
      const runnerUp = sortedParties[1];
      const margin = votes[leader] - votes[runnerUp];

      return {
        id: `${districtName}-${seatIndex + 1}`,
        seatNo: seatIndex + 1,
        constituency: constituencyName,
        countedPercent,
        totalVotes,
        countedVotes,
        votes,
        leader,
        runnerUp,
        margin,
      };
    });

    const districtLeadMap = seats.reduce(
      (accumulator, seat) => ({
        ...accumulator,
        [seat.leader]: accumulator[seat.leader] + 1,
      }),
      { TVK: 0, "DMK Alliance": 0, "ADMK Alliance": 0 }
    );

    return {
      district: districtName,
      seats,
      seatCount: constituencies.length,
      totalCountedVotes: seats.reduce((total, seat) => total + seat.countedVotes, 0),
      reportingAverage: Math.round(
        seats.reduce((total, seat) => total + seat.countedPercent, 0) / seats.length
      ),
      districtLeadMap,
    };
  });

const SeatBar = ({ label, value, color }) => (
  <div className="seat-bar-row">
    <div className="seat-bar-label">
      <span
        className="seat-bar-dot"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
    <div className="seat-bar-track">
      <div
        className="seat-bar-fill"
        style={{
          width: `${(value / TOTAL_SEATS) * 100}%`,
          background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.95))`,
        }}
      />
    </div>
    <strong>{value}</strong>
  </div>
);

function App() {
  const [stageIndex, setStageIndex] = useState(COUNTING_STAGES.length - 1);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState("All districts");
  const [officialFeed, setOfficialFeed] = useState({
    status: "loading",
    message: "Checking official ECI feed...",
  });

  useEffect(() => {
    if (!isAutoPlay) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setStageIndex((current) => (current + 1) % COUNTING_STAGES.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, [isAutoPlay]);

  useEffect(() => {
    let isMounted = true;

    const loadOfficialFeed = async () => {
      try {
        const response = await fetch(OFFICIAL_FEED_URL);
        const payload = await response.json();

        if (!isMounted) {
          return;
        }

        setOfficialFeed(payload);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setOfficialFeed({
          status: "error",
          message: "Could not reach the backend election feed.",
        });
      }
    };

    loadOfficialFeed();
    const timer = window.setInterval(loadOfficialFeed, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const currentStage = COUNTING_STAGES[stageIndex];

  const partyCards = useMemo(
    () =>
      partyNames.map((party) => ({
        name: party,
        ...PARTY_META[party],
        ...currentStage.parties[party],
      })),
    [currentStage]
  );

  const voteShareData = useMemo(
    () =>
      partyCards.map((party) => ({
        name: PARTY_META[party.name].short,
        votes: party.votes,
        voteShare: party.voteShare,
        fill: party.color,
      })),
    [partyCards]
  );

  const trendData = useMemo(
    () =>
      COUNTING_STAGES.map((stage) => ({
        time: stage.timestamp,
        TVK: stage.parties.TVK.seats,
        DMK: stage.parties["DMK Alliance"].seats,
        ADMK: stage.parties["ADMK Alliance"].seats,
      })),
    []
  );
  const districtPanels = useMemo(
    () => buildSeatRows(currentStage, stageIndex),
    [currentStage, stageIndex]
  );
  const isOfficialFeedLive =
    (officialFeed.status === "live" || officialFeed.status === "partial") &&
    Array.isArray(officialFeed.constituencies) &&
    officialFeed.constituencies.length > 0;
  const officialAllianceSummary = useMemo(() => {
    if (!isOfficialFeedLive) {
      return null;
    }

    return officialFeed.constituencies.reduce(
      (accumulator, row) => {
        const alliance = getAllianceForParty(row.leadingParty);
        if (alliance) {
          accumulator[alliance] += 1;
        }
        return accumulator;
      },
      { TVK: 0, "DMK Alliance": 0, "ADMK Alliance": 0 }
    );
  }, [isOfficialFeedLive, officialFeed.constituencies]);
  const officialDistrictPanels = useMemo(() => {
    if (!isOfficialFeedLive) {
      return [];
    }

    const grouped = districtNames.map((districtName) => {
      const seats = officialFeed.constituencies
        .filter(
          (row) => constituencyDistrictMap[(row.constituency || "").toLowerCase()] === districtName
        )
        .sort((left, right) => left.constNo - right.constNo)
        .map((row, index) => ({
          id: `${districtName}-${row.constNo || index + 1}`,
          seatNo: row.constNo || index + 1,
          constituency: row.constituency,
          leader: getAllianceForParty(row.leadingParty),
          leadingParty: row.leadingParty,
          leadingCandidate: row.leadingCandidate,
          trailingParty: row.trailingParty,
          trailingCandidate: row.trailingCandidate,
          margin: row.margin,
          round: row.round,
          status: row.status,
          isOfficial: true,
        }));

      const districtLeadMap = seats.reduce(
        (accumulator, seat) => {
          if (!seat.leader) {
            return accumulator;
          }

          return {
            ...accumulator,
            [seat.leader]: accumulator[seat.leader] + 1,
          };
        },
        { TVK: 0, "DMK Alliance": 0, "ADMK Alliance": 0 }
      );

      return {
        district: districtName,
        seats,
        seatCount: seats.length,
        reportingAverage: null,
        totalCountedVotes: 0,
        districtLeadMap,
      };
    });

    return grouped.filter((panel) => panel.seats.length > 0);
  }, [isOfficialFeedLive, officialFeed.constituencies]);
  const activePartyCards = useMemo(() => {
    if (!isOfficialFeedLive || !officialAllianceSummary) {
      return partyCards;
    }

    return partyNames.map((party) => ({
      name: party,
      ...PARTY_META[party],
      seats: officialAllianceSummary[party],
      votes: officialAllianceSummary[party],
      voteShare: ((officialAllianceSummary[party] / TOTAL_SEATS) * 100).toFixed(1),
      swing: null,
      isOfficial: true,
    }));
  }, [isOfficialFeedLive, officialAllianceSummary, partyCards]);
  const activeSeatShareData = useMemo(
    () =>
      activePartyCards.map((party) => ({
        name: PARTY_META[party.name].short,
        seats: party.seats,
        fill: party.color,
      })),
    [activePartyCards]
  );
  const activeDistrictPanels = useMemo(() => {
    const sourcePanels = isOfficialFeedLive ? officialDistrictPanels : districtPanels;
    return selectedDistrict === "All districts"
      ? sourcePanels
      : sourcePanels.filter((panel) => panel.district === selectedDistrict);
  }, [
    districtPanels,
    isOfficialFeedLive,
    officialDistrictPanels,
    selectedDistrict,
  ]);
  const activeBattlegrounds = useMemo(() => {
    if (!isOfficialFeedLive) {
      return currentStage.battlegrounds;
    }

    return [...officialFeed.constituencies]
      .sort((left, right) => left.margin - right.margin)
      .slice(0, 4)
      .map((seat) => ({
        name: seat.constituency,
        leader: getAllianceForParty(seat.leadingParty),
        margin: seat.margin,
        update: `${seat.leadingCandidate} (${seat.leadingParty}) vs ${seat.trailingCandidate} (${seat.trailingParty})`,
      }));
  }, [currentStage.battlegrounds, isOfficialFeedLive, officialFeed.constituencies]);

  const leadingParty = [...activePartyCards].sort((a, b) => b.seats - a.seats)[0];
  const majorityMark = Math.floor(TOTAL_SEATS / 2) + 1;
  const seatsToMajority = Math.max(0, majorityMark - leadingParty.seats);
  const officialFeedLabel =
    officialFeed.status === "live" || officialFeed.status === "partial"
      ? "Official ECI feed connected"
      : officialFeed.status === "scheduled"
        ? "Official ECI feed scheduled"
        : officialFeed.status === "error"
          ? "Official ECI feed unavailable"
          : "Checking official ECI feed";
  const officialFeedMessage =
    officialFeed.status === "scheduled"
      ? officialFeed.message
      : officialFeed.status === "live" || officialFeed.status === "partial"
        ? "Dashboard is connected to the official ECI results source through the backend."
        : officialFeed.message || "Waiting for official source status.";
  const officialCheckedAt = officialFeed.checkedAt
    ? new Date(officialFeed.checkedAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <main className="dashboard-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Tamil Nadu Assembly Election 2026</p>
          <h1>Real-time counting dashboard for TVK, DMK alliance, and ADMK alliance</h1>
          <p className="hero-subcopy">
            Track live-looking seat leads, vote share, battleground constituencies,
            and counting progress in a broadcast-style results room.
          </p>

          <div className="hero-meta">
            <div className="meta-chip">
              <span className="live-dot" />
              <span>Counting update {currentStage.timestamp}</span>
            </div>
            <div className="meta-chip">
              <span>{currentStage.reportingPercent}% booths reported</span>
            </div>
            <div className="meta-chip">
              <span>{currentStage.turnoutPercent}% counted turnout</span>
            </div>
            <div className="meta-chip">
              <span>{officialFeedLabel}</span>
            </div>
            {officialCheckedAt ? (
              <div className="meta-chip">
                <span>Checked {officialCheckedAt}</span>
              </div>
            ) : null}
          </div>
        </div>

        <div className="hero-status-card">
          <p className="status-label">Front Runner</p>
          <h2>{leadingParty.name}</h2>
          <div className="status-stat">
            <strong>{leadingParty.seats}</strong>
            <span>seats leading</span>
          </div>
          <p className="status-copy">
            {seatsToMajority === 0
              ? `Above the ${majorityMark} seat majority mark.`
              : `${seatsToMajority} more seats needed to cross the ${majorityMark} majority mark.`}
          </p>

          <button
            type="button"
            className="mode-toggle"
            onClick={() => setIsAutoPlay((value) => !value)}
          >
            {isAutoPlay ? "Pause ticker" : "Resume ticker"}
          </button>
        </div>
      </section>

      <section className="summary-grid">
        <article className="stat-card">
          <span className="stat-label">
            {isOfficialFeedLive ? "Official Constituencies" : "Total Polled"}
          </span>
          <strong>
            {isOfficialFeedLive
              ? `${officialFeed.constituencies.length}/${TOTAL_SEATS}`
              : formatCompact(currentStage.totalVotes)}
          </strong>
          <span className="stat-footnote">
            {isOfficialFeedLive
              ? "Constituencies available from the official ECI state feed"
              : `${formatNumber(currentStage.totalVotes)} total polled votes in the current dashboard feed`}
          </span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Seats Trending</span>
          <strong>{activePartyCards.reduce((sum, party) => sum + party.seats, 0)}</strong>
          <span className="stat-footnote">Out of {TOTAL_SEATS} assembly seats</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">
            {isOfficialFeedLive ? "Official Update" : "Booth Reporting"}
          </span>
          <strong>
            {isOfficialFeedLive
              ? officialCheckedAt || "Live"
              : `${currentStage.reportingPercent}%`}
          </strong>
          <span className="stat-footnote">Count stream refreshed every 3 seconds</span>
        </article>
        <article className="stat-card">
          <span className="stat-label">Data Source</span>
          <strong>{officialFeedLabel}</strong>
          <span className="stat-footnote">
            {officialFeedMessage}
          </span>
        </article>
      </section>

      <section className="party-grid">
        {activePartyCards.map((party) => (
          <article
            key={party.name}
            className="party-card"
            style={{
              "--party-color": party.color,
              "--party-glow": party.glow,
            }}
          >
            <div className="party-card-top">
              <div>
                <p className="party-tag">{party.short}</p>
                <h3>{party.name}</h3>
              </div>
              {party.swing !== null ? (
                <span className="swing-pill">
                  {party.swing > 0 ? "+" : ""}
                  {party.swing}% swing
                </span>
              ) : (
                <span className="swing-pill">Official tally</span>
              )}
            </div>

            <div className="party-figures">
              <div>
                <span className="figure-label">Seats</span>
                <strong>{party.seats}</strong>
              </div>
              <div>
                <span className="figure-label">
                  {party.isOfficial ? "Known Seats" : "Votes"}
                </span>
                <strong>{party.isOfficial ? party.votes : formatCompact(party.votes)}</strong>
              </div>
              <div>
                <span className="figure-label">
                  {party.isOfficial ? "Seat share" : "Vote share"}
                </span>
                <strong>{party.voteShare}%</strong>
              </div>
            </div>

            <div className="vote-progress">
              <div className="vote-progress-meta">
                <span>{party.isOfficial ? "Share of known seats" : "Share of counted votes"}</span>
                <span>{party.voteShare}%</span>
              </div>
              <div className="vote-progress-track">
                <div
                  className="vote-progress-fill"
                  style={{
                    width: `${party.voteShare}%`,
                    background: `linear-gradient(90deg, ${party.color}, ${party.accent})`,
                  }}
                />
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel panel-large">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Seat Race</p>
              <h3>Lead progression across counting rounds</h3>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="tvkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="dmkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="admkGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#cbd5e1", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#cbd5e1", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "#09111f",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 16,
                    color: "#e2e8f0",
                  }}
                />
                <Area type="monotone" dataKey="TVK" stroke="#f97316" fill="url(#tvkGradient)" strokeWidth={3} />
                <Area type="monotone" dataKey="DMK" stroke="#ef4444" fill="url(#dmkGradient)" strokeWidth={3} />
                <Area type="monotone" dataKey="ADMK" stroke="#10b981" fill="url(#admkGradient)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Seat Share</p>
              <h3>Distribution of current leads</h3>
            </div>
          </div>

          <div className="donut-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activeSeatShareData}
                  dataKey="seats"
                  innerRadius={78}
                  outerRadius={108}
                  paddingAngle={3}
                >
                  {activeSeatShareData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#09111f",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 16,
                    color: "#e2e8f0",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{majorityMark}</strong>
              <span>Majority mark</span>
            </div>
          </div>

          <div className="seat-bars">
            {activePartyCards.map((party) => (
              <SeatBar
                key={party.name}
                label={party.short}
                value={party.seats}
                color={party.color}
              />
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">{isOfficialFeedLive ? "Seat Share" : "Vote Share"}</p>
              <h3>
                {isOfficialFeedLive
                  ? "Official alliance seat position from ECI feed"
                  : "Counted ballots by alliance"}
              </h3>
            </div>
          </div>

          <div className="chart-wrap compact">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={
                  isOfficialFeedLive
                    ? activePartyCards.map((party) => ({
                        name: PARTY_META[party.name].short,
                        votes: party.seats,
                        fill: party.color,
                      }))
                    : voteShareData
                }
                layout="vertical"
                margin={{ left: 10, right: 16 }}
              >
                <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "#cbd5e1", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => (isOfficialFeedLive ? value : formatCompact(value))}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#e2e8f0", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) =>
                    isOfficialFeedLive ? `${value} seats` : formatNumber(value)
                  }
                  contentStyle={{
                    background: "#09111f",
                    border: "1px solid rgba(148, 163, 184, 0.2)",
                    borderRadius: 16,
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="votes" radius={[0, 12, 12, 0]}>
                  {(isOfficialFeedLive
                    ? activePartyCards.map((party) => ({
                        name: PARTY_META[party.name].short,
                        fill: party.color,
                      }))
                    : voteShareData
                  ).map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <p className="panel-kicker">Battlegrounds</p>
              <h3>Key constituency watchlist</h3>
            </div>
          </div>

          <div className="battleground-list">
            {activeBattlegrounds.map((seat) => {
              const battleMeta = seat.leader ? PARTY_META[seat.leader] : OTHER_PARTY_META;

              return (
              <div key={seat.name} className="battle-row">
                <div>
                  <strong>{seat.name}</strong>
                  <p>{seat.update}</p>
                </div>
                <div className="battle-metrics">
                  <span
                    className="battle-party"
                    style={{ color: battleMeta.accent }}
                  >
                    {battleMeta.short}
                  </span>
                  <strong>{formatNumber(seat.margin)}</strong>
                  <span>lead</span>
                </div>
              </div>
              );
            })}
          </div>
        </article>
      </section>

      <section className="panel district-panel">
        <div className="panel-head district-head">
          <div>
            <p className="panel-kicker">District-Wise Panel</p>
            <h3>
              {isOfficialFeedLive
                ? "Official ECI constituency feed grouped district-wise"
                : "All 234 assembly seats with live vote counts"}
            </h3>
          </div>
          <div className="district-summary">
            <span>{districtNames.length} districts</span>
            <span>{TOTAL_SEATS} constituencies</span>
          </div>
        </div>

        <div className="district-filter-row">
          <button
            type="button"
            className={selectedDistrict === "All districts" ? "district-chip active" : "district-chip"}
            onClick={() => setSelectedDistrict("All districts")}
          >
            All districts
          </button>
          {districtNames.map((district) => (
            <button
              key={district}
              type="button"
              className={selectedDistrict === district ? "district-chip active" : "district-chip"}
              onClick={() => setSelectedDistrict(district)}
            >
              {district}
            </button>
          ))}
        </div>

        <div className="district-groups">
          {activeDistrictPanels.map((panel) => (
            <details
              key={panel.district}
              className="district-group"
              open={selectedDistrict !== "All districts" || panel.district === "Chennai"}
            >
              <summary className="district-group-summary">
                <div>
                  <strong>{panel.district}</strong>
                  <span>
                    {isOfficialFeedLive
                      ? `${panel.seatCount} official constituencies in feed`
                      : `${panel.seatCount} seats, ${formatCompact(panel.totalCountedVotes)} counted votes`}
                  </span>
                </div>
                <div className="district-group-meta">
                  <span>
                    {isOfficialFeedLive
                      ? "Official constituency status"
                      : `${panel.reportingAverage}% avg reporting`}
                  </span>
                  <span>TVK {panel.districtLeadMap.TVK}</span>
                  <span>DMK+ {panel.districtLeadMap["DMK Alliance"]}</span>
                  <span>ADMK+ {panel.districtLeadMap["ADMK Alliance"]}</span>
                </div>
              </summary>

              <div className="district-seat-table">
                <div className="district-seat-table-head">
                  <span>Seat</span>
                  <span>Leading</span>
                  <span>{isOfficialFeedLive ? "Trailing" : "Votes"}</span>
                  <span>Margin</span>
                  <span>{isOfficialFeedLive ? "Round Status" : "Reporting"}</span>
                </div>

                {panel.seats.map((seat) => {
                  const seatMeta = seat.leader ? PARTY_META[seat.leader] : OTHER_PARTY_META;

                  return (
                  <div key={seat.id} className="district-seat-row">
                    <div>
                      <strong>
                        {seat.seatNo}. {seat.constituency}
                      </strong>
                      <p>
                        {seat.isOfficial
                          ? `${seat.leadingCandidate} (${seat.leadingParty})`
                          : `TVK ${formatCompact(seat.votes.TVK)} | DMK+ ${formatCompact(
                              seat.votes["DMK Alliance"]
                            )} | ADMK+ ${formatCompact(seat.votes["ADMK Alliance"])}`}
                      </p>
                    </div>
                    <span
                      className="seat-leader-badge"
                      style={{
                        color: seatMeta.accent,
                        borderColor: `${seatMeta.color}55`,
                      }}
                    >
                      {seatMeta.short}
                    </span>
                    <strong>
                      {seat.isOfficial
                        ? `${seat.trailingCandidate} (${seat.trailingParty})`
                        : formatNumber(sumVotes(seat, partyNames))}
                    </strong>
                    <strong>{formatNumber(seat.margin)}</strong>
                    <span>{seat.isOfficial ? `${seat.round} ${seat.status}` : `${seat.countedPercent}%`}</span>
                  </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

export default App;
