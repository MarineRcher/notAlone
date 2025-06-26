import { QueryInterface, DataTypes, QueryTypes } from "sequelize";
import { v4 as uuidv4 } from "uuid";

export default {
    async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes) {
        const now = new Date();
        
        await queryInterface.createTable("links", {
            id_link: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
            },name_link:{
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [1, 255],
            },
        },
            resume: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    notEmpty: true,
                    len: [1, 255],
                },
            },
            id_addiction: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: "addictions",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },
            image_url: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            link: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
            },
        });

        interface AddictionRow {
            id: string;
            addiction: string;
        }



        const result = await queryInterface.sequelize.query(
            'SELECT id, addiction FROM addictions',
            { type: QueryTypes.SELECT, raw: true}
        );
        const addictionsData = (result as unknown) as AddictionRow[];



        const addictionsMap = addictionsData.reduce((acc, addiction) => {
            acc[addiction.addiction] = addiction.id;
            return acc;
        }, {} as Record<string, string>);

        // Données d'exemple pour les liens
        const linksData = [
            {
                id_link: uuidv4(),
                name: "Tabac Info Service",
                resume: "Coaching gratuit personnalisé, forum, appli mobile d’aide au sevrage.",
                link: "https://www.tabac-info-service.fr",
                image_url: "/static/links/tabac/tabac-info-service.png",
                name_link: "Tabac info service",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Tabac"]
            }, {
                id_link: uuidv4(),
                name: "Alliance contre le tabac",
                resume: "Prévention jeunesse, lobbying anti-tabac, actions sociales.",
                link: "https://alliancecontreletabac.org/",
                image_url: "/static/links/tabac/allicance-contre-tabac.png",
                name_link: "ACT - Alliance Contre le Tabac",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Tabac"]
            },{
                id_link: uuidv4(),
                name: "Comité National contre le Tabagisme",
                resume: "Prévention jeunesse, lobbying anti-tabac, actions sociales, soutien juridique.",
                link: "https://cnct.fr/",
                image_url: "/static/links/tabac/cnct.png",
                name_link: "CNCT Comité National contre le Tabagisme (CNCT)",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Tabac"]
            },{
                id_link: uuidv4(),
                name: "Alcool Info Service",
                resume: "Écoute, tchat en ligne, accompagnement personnalisé.",
                link: "https://www.alcool-info-service.fr/",
                image_url: "/static/links/alcool/alcool-info-service.png",
                name_link: "Accueil | Alcool Info Service",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Alcool"]
            },{
                id_link: uuidv4(),
                name: "Association Vie Libre",
                resume: "Aide par les pairs, groupes de parole.",
                link: "https://www.vielibre.org/",
                image_url: "/static/links/alcool/association-vie-libre.png",
                name_link: "Vie Libre - Vie Libre",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Alcool"]
            },{
                id_link: uuidv4(),
                name: "Alcooliques Anonymes France",
                resume: "Réunions partout en France, soutien 24h/24.",
                link: "https://alcooliques-anonymes.fr/",
                image_url: "/static/links/alcool/aa.png",
                name_link: "Accueil - Alcooliques Anonymes - Tel 09 69 39 40 20",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Alcool"]
            },{
                id_link: uuidv4(),
                name: "Fédération Addiction",
                resume: "Approche médico-sociale, publications, accompagnement professionnel.",
                link: "https://www.alcool-info-service.fr/",
                image_url: "/static/links/alcool/federation-addiction.png",
                name_link: "Accueil - Fédération Addiction",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Alcool"]
            },
            {
                id_link: uuidv4(),
                name: "ANJ (Autorité Nationale des Jeux)",
                resume: "Infos sur les risques, auto-exclusion, limites de jeu",
                link: "https://anj.fr/",
                image_url: "/static/links/jeuxArgent/anj.png",
                name_link: "Accueil | ANJ",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Jeux d'argent"]
            },{
                id_link: uuidv4(),
                name: "SOS Joueurs",
                resume: "Aide sociale et psychologique, soutien juridique",
                link: "https://www.sosjoueurs.org/",
                image_url: "/static/links/jeuxArgent/sos-joueurs.png",
                name_link: "Addiction aux jeux d'argent, jeux vidéos  | SOS Joueurs",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Jeux d'argent"]
            },{
                id_link: uuidv4(),
                name: "Joueurs Info Service",
                resume: "Écoute, accompagnement, annuaire d’aides locales, tchat avec un professionnel",
                link: "https://www.joueurs-info-service.fr/",
                image_url: "/static/links/jeuxArgent/joueurs-info-service.png",
                name_link: "Joueurs Info Service",
                created_at: now,
                updated_at: now,
                id_addiction: addictionsMap["Jeux d'argent"]
            },
            
        ];

        // Filtrer les liens qui ont un id_addiction valide
        const validLinks = linksData.filter(link => link.id_addiction);

        if (validLinks.length > 0) {
            await queryInterface.bulkInsert("links", validLinks);
            console.log(`✅ Inserted ${validLinks.length} links`);
        } else {
            console.warn("⚠️ No valid addiction IDs found, no links inserted");
        }
    },

    async down(queryInterface: QueryInterface) {
        await queryInterface.dropTable("links");
    },
};