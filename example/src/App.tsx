import React, { useEffect, useState } from 'react';

import {
    Modal,
    ActivityIndicator,
    SafeAreaView,
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';

import { AppUpdate } from 'react-native-in-app-update';

const App = () => {
    const [updateData, setUpdateData] = useState<{
        url: string;
        updateMessage: string;
    } | null>(null);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isApkLoaded, setApkLoaded] = useState(false);
    const [apkName, setApkName] = useState<string | null>(null);
    const [isApkLoading, setDownloading] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<number | null>(null);

    const checkUpdate = async () => {
        if (Platform.OS === 'ios') {
            Alert.alert('iOS is not supported');

            return false;
        }

        const result = await fetch(
            'https://raw.githubusercontent.com/NepeinAV/react-native-in-app-update/master/example/app-updates/update.json',
        );
        const data = await result.json();
        const currentVersionCode = await AppUpdate.getVersionCode();

        if (data.versionCode <= currentVersionCode) {
            Alert.alert('Update was not found');
        } else {
            setUpdateData(data);
        }

        return;
    };

    useEffect(() => {
        const run = async () => {
            setCurrentVersion(await AppUpdate.getVersionCode());
        };

        run();
    }, []);

    useEffect(() => {
        if (Platform.OS === 'ios') {
            return;
        }

        const unsubscribe = AppUpdate.onDownloadProgress(async (event) => {
            if (event.status === 'start') {
                setDownloadProgress(0);
                setDownloading(true);
                setApkLoaded(false);
                setApkName(null);

                return;
            }

            if (event.status === 'downloading') {
                setDownloadProgress(event.progress);

                return;
            }

            if (event.status === 'end') {
                setDownloadProgress(100);
                setDownloading(false);

                setApkLoaded(true);
                setApkName(event.apkFileName);

                await AppUpdate.installApp(event.apkFileName);

                return;
            }

            if (event.status === 'error') {
                Alert.alert(event.errorMessage);

                setDownloadProgress(0);
                setDownloading(false);
                setApkLoaded(false);
                setApkName(null);

                return;
            }
        });

        return unsubscribe;
    }, []);

    const canInstallApk = isApkLoaded && apkName;

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>
                App current versionCode: {currentVersion}
            </Text>

            <View style={{ height: 10 }} />

            <TouchableOpacity style={styles.button} onPress={checkUpdate}>
                <Text>Проверить обновления</Text>
            </TouchableOpacity>

            <Modal visible={updateData !== null} animationType={'slide'}>
                {updateData && (
                    <View style={styles.container}>
                        <Text style={styles.title}>
                            Найдено обновление приложения!
                        </Text>
                        <Text>{updateData.updateMessage}</Text>

                        <View style={{ height: 10 }} />

                        <View>
                            <TouchableOpacity
                                onPress={async () =>
                                    canInstallApk
                                        ? await AppUpdate.installApp(apkName)
                                        : AppUpdate.updateApp(updateData.url)
                                }
                                style={styles.button}
                            >
                                <Text>
                                    {canInstallApk
                                        ? 'Установить'
                                        : 'Обновить приложение'}
                                </Text>

                                <View
                                    style={[
                                        styles.progressIndicator,
                                        { width: `${downloadProgress}%` },
                                    ]}
                                />

                                {isApkLoading && (
                                    <ActivityIndicator
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#ccc',
        paddingVertical: 20,
        borderRadius: 10,
        overflow: 'hidden',
    },
    container: {
        padding: 12,
    },
    progressIndicator: {
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,255,0.1)',
    },
    title: {
        fontSize: 22,
        color: '#222',
    },
});

export default App;
