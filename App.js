import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';

const DOGS = [
  'Golden Retriever',
  'French Bulldog',
  'Poodle',
  'Beagle',
  'Chihuahua',
  'Siberian Husky',
  'Corgi',
  'Dachshund'
];

export default function App() {
  const [score, setScore] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState(30);
  const [dog, setDog] = React.useState(DOGS[Math.floor(Math.random() * DOGS.length)]);
  const [level, setLevel] = React.useState(1);
  const [gameOver, setGameOver] = React.useState(false);

  React.useEffect(() => {
    if (gameOver) return;
    if (timeLeft <= 0) {
      setGameOver(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, gameOver]);

  const nextDog = () => {
    const next = DOGS[Math.floor(Math.random() * DOGS.length)];
    setDog(next);
  };

  const onCatch = () => {
    const newScore = score + 10 * level;
    setScore(newScore);
    setLevel(1 + Math.floor(newScore / 100));
    setTimeLeft((t) => Math.max(t - 1, 1));
    nextDog();
  };

  const onRestart = () => {
    setScore(0);
    setTimeLeft(30);
    setLevel(1);
    setGameOver(false);
    setDog(DOGS[Math.floor(Math.random() * DOGS.length)]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Costco Dogs</Text>
      <Text style={styles.status}>Dog to catch: {dog}</Text>
      <Text style={styles.score}>Score: {score}</Text>
      <Text style={styles.status}>Level: {level}  •  Time left: {timeLeft}s</Text>

      {gameOver ? (
        <View style={styles.gameOverBox}>
          <Text style={styles.gameOverText}>Game Over</Text>
          <Text style={styles.score}>Final Score: {score}</Text>
          <Pressable style={styles.button} onPress={onRestart}>
            <Text style={styles.buttonText}>Play Again</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.button} onPress={onCatch}>
          <Text style={styles.buttonText}>Catch {dog}</Text>
        </Pressable>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f4e6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  status: {
    fontSize: 18,
    color: '#343a40',
    marginBottom: 12,
  },
  score: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
  },
  gameOverBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#dc3545',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  }
});
