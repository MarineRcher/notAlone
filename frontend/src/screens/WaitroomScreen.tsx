import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import styles from './WaitroomScreen.style';
import io, { Socket } from 'socket.io-client';
import { apiConfig } from '../config/api';

interface WaitroomScreenProps {
  navigation: any;
}

interface WaitingUser {
  userId: string;
  username: string;
}

export default function WaitroomScreen({ navigation }: WaitroomScreenProps) {
  const { user } = useAuth();
  const [waitingUsers, setWaitingUsers] = useState<WaitingUser[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Connexion...');
  const [minMembers, setMinMembers] = useState(3);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (user) {
      initializeWaitroom();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_waitroom');
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const initializeWaitroom = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('Connexion au serveur...');

      // Initialize socket connection
      const socket = io(apiConfig.socketURL, {
        auth: {
          token: `mock_jwt_token_${user!.id}`,
        },
        transports: ['websocket'],
        timeout: 10000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('✅ Connected to waitroom:', socket.id);
        setConnectionStatus('Rejoindre la salle d\'attente...');
        socket.emit('join_waitroom');
      });

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from waitroom');
        setConnectionStatus('Connexion perdue');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Waitroom connection error:', error);
        setConnectionStatus('Erreur de connexion');
        setIsConnecting(false);
        Alert.alert('Erreur de connexion', 'Impossible de se connecter au serveur. Veuillez réessayer.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      });

      // Waitroom events
      socket.on('waitroom_joined', (data) => {
        console.log('📋 Joined waitroom:', data);
        setWaitingUsers(data.waitingUsers);
        setMinMembers(data.minMembers);
        setConnectionStatus(`En attente... (${data.waitingUsers.length}/${data.minMembers} joueurs)`);
        setIsConnecting(false);
      });

      socket.on('waitroom_updated', (data) => {
        console.log('📋 Waitroom updated:', data);
        setWaitingUsers(data.waitingUsers);
        setConnectionStatus(`En attente... (${data.waitingUsers.length}/${data.minMembers} joueurs)`);
      });

      socket.on('group_created', (data) => {
        console.log('🎉 Group created!', data);
        setConnectionStatus('Groupe créé ! Redirection...');
        
        setTimeout(() => {
          navigation.replace('GroupChat', {
            groupId: data.groupId,
            groupName: data.groupName
          });
        }, 1500);
      });

      socket.on('waitroom_error', (data) => {
        console.error('❌ Waitroom error:', data);
        Alert.alert('Erreur', data.message, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      });

    } catch (error) {
      console.error('❌ Failed to initialize waitroom:', error);
      setConnectionStatus('Erreur d\'initialisation');
      setIsConnecting(false);
      Alert.alert('Erreur', 'Impossible de rejoindre la salle d\'attente.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const leaveWaitroom = () => {
    Alert.alert(
      'Quitter',
      'Êtes-vous sûr de vouloir quitter la salle d\'attente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            if (socketRef.current) {
              socketRef.current.emit('leave_waitroom');
              socketRef.current.disconnect();
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗣️ Cercle de parole</Text>
        <Text style={styles.subtitle}>Salle d'attente</Text>
      </View>

      <View style={styles.waitroomContainer}>
        <Text style={styles.statusText}>{connectionStatus}</Text>
        
        {isConnecting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Connexion en cours...</Text>
          </View>
        ) : (
          <>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${(waitingUsers.length / minMembers) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {waitingUsers.length} / {minMembers} joueurs
              </Text>
            </View>

            <View style={styles.usersContainer}>
              <Text style={styles.usersTitle}>Joueurs en attente :</Text>
              {waitingUsers.map((waitingUser, index) => (
                <View key={waitingUser.userId} style={styles.userItem}>
                  <Text style={styles.userText}>
                    {waitingUser.userId === user?.id ? '🔵 Vous' : `👤 ${waitingUser.username}`}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoText}>
                {waitingUsers.length < minMembers 
                  ? `Nous avons besoin de ${minMembers - waitingUsers.length} joueur(s) supplémentaire(s) pour commencer le cercle de parole.`
                  : "Le groupe va bientôt être créé..."
                }
              </Text>
              <Text style={styles.helpText}>
                Une fois que tous les joueurs auront rejoint, vous serez automatiquement dirigé vers le chat sécurisé.
              </Text>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity style={styles.cancelButton} onPress={leaveWaitroom}>
        <Text style={styles.cancelButtonText}>Quitter la salle d'attente</Text>
      </TouchableOpacity>
    </View>
  );
} 